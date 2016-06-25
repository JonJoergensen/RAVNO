/*global define:false, Modernizr:false */
define(['jquery'], function ($) {
    //'use strict';

    

  
    var webserviceUrl = "TaxaWebservice.asmx";

    // Webservice url
    if (location.hostname.indexOf("test.ravno") > -1 || location.hostname.indexOf("taxaplan.ravno") > -1)
    {
        webserviceUrl = webserviceUrl;

        if (location.hostname.indexOf("test.ravno") > -1) {
            $("body").addClass("test-env");
        }
    }
    else if (location.hostname.indexOf("ravno") > -1)
    {
        webserviceUrl = "/rdTaxa/" + webserviceUrl;
    }
  
   


    $(window).keydown(function (e) {
        if (e.keyCode == 13) {
            $('[data-login]').click();
        }
    })

    $('[data-back]').on('click', function (e) {
        e.preventDefault();

        $(".schedule-view").slideUp(function () {

            $(".login-view").slideDown();
        });
    });


    $('[data-login]').on('click', function (e) {
        e.preventDefault();

        VerifyUser();

     
    });


    // Check ud på den valgte vagtplan
    $('[data-start]').on('click', function (e) {
        e.preventDefault();

        // Check ud på den valgte vagtplan
        var vagtID = $("#schedulePicker").val();

        if (vagtID != null) {

            var company = localStorage.getItem('rdTaxaLoginCompany');
            var username = localStorage.getItem('rdTaxaLoginUsername');
            var password = localStorage.getItem('rdTaxaLoginPassword');

            $.ajax({
                type: "POST",
                url: webserviceUrl + "/checkinVagt",
                data: "{username:'" + username + "',password:'" + password + "',company:'" + company + "',vagtID:'" + vagtID + "'}",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {

                    var result = JSON.parse(result.d);

                    if (result == true) {
                                                
                        // Redirect to fares page
                        location.href = "fares.html";
                    }
                    else {
                        ShowAlert("Fejl", result);
                    }

                },
                error: function (xhr, textStatus, errorThrown) {

                    ShowAlert("Fejl", errorThrown);
                }
            });
        }
        else {
            ShowAlert("Vogne optaget", "Alle vogne er optaget. Hvis der burde være en vogn ledig, så bed venligst kontoret eller chaufføren logge sig ud, så du har mulighed for at vælge en tur.");
        }      

    });

    function VerifyUser() {

        // Check here if app is online///
        if (navigator.onLine) {
            var company = $("#company").val();
            var username = $("#username").val();
            var password = $("#password").val();

            $.ajax({
                type: "POST",
                url: webserviceUrl + "/VerifyUser",
                data: "{username:'" + username + "',password:'" + password + "',company:'" + company + "'}",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {

                    var user = JSON.parse(result.d);

                    if (user == false) {
                        ShowAlert("Login mislykkedes", "Firma, Brugernavn, eller Adgangskode var forkert. <br />Verificer venligst dine login oplysninger igen. Hvis ikke du kan komme ind, så tag venligst kontakt til en it-ansvarlig");
                    }
                    else if (user == "System down") {
                        ShowAlert("Bruger deaktiveret", "Brugeren er deaktiveret. Kontakt venligst en it-ansvarlig for systemet for at få assistance");
                    }
                    else {

                        // Code for localStorage/sessionStorage.      
                        if (typeof (Storage) !== "undefined") {

                                
                            // Remember info
                            localStorage.setItem('rdTaxaLoginCompany', company);
                            localStorage.setItem('rdTaxaLoginUsername', username);
                            localStorage.setItem('rdTaxaLoginPassword', password);
                            localStorage.setItem('rdTaxaLoginChaufforID', user.ChaufforID);

                            
                            GetVagtPlan();


                        } else {
                            // Sorry! No Web Storage support..
                            ShowAlert("Login mislykkedes", "Log ind oplysninger kan ikke gemmes i denne browser. Proev venligst en anden browser");
                        }

                    }
                },
                error: function (xhr, textStatus, errorThrown) {

                    ShowAlert("Fejl", errorThrown);
                }
            });

        }
        else {
            // Error message like. Internet connection is not available at the moment, will automatically try again in 2 min, or have a button "retry now"
            ShowAlert("Ingen internet forbindelse", "Internetforbindelsen er ikke tilgaengelig i oejeblikket. Proev igen om lidt");
        }
    }



    function GetVagtPlan() {

        // Check here if app is online///
        if (navigator.onLine) {

            var company = localStorage.getItem('rdTaxaLoginCompany');
            var username = localStorage.getItem('rdTaxaLoginUsername');
            var password = localStorage.getItem('rdTaxaLoginPassword');
            var chaufforID = localStorage.getItem('rdTaxaLoginChaufforID');

            
            $.ajax({
                type: "POST",
                url: webserviceUrl + "/getVagtPlan",
                data: "{username:'" + username + "',password:'" + password + "',company:'" + company + "'}",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {

                    var vagtplan = JSON.parse(result.d);

                    if (vagtplan == false) {
                        ShowAlert("Login mislykkedes", "Firma, Brugernavn, eller Adgangskode var forkert. <br />Verificer venligst dine login oplysninger igen. Hvis ikke du kan komme ind, så tag venligst kontakt til en it-ansvarlig");
                    }
                    else if (vagtplan == "System down") {
                        ShowAlert("Bruger deaktiveret", "Brugeren er deaktiveret. Kontakt venligst en it-ansvarlig for systemet for at få assistance");
                    }
                    else {

  
                        // Code for localStorage/sessionStorage.      
                        if (typeof (Storage) !== "undefined") {
                            

                            var userIsAttachedToSchedule = false;

                            // Check if user is already attached to a schedule, and if true direct him to it
                            if (chaufforID != null) {

                                for (var i = 0; i < vagtplan.length; i++) {

                                    if (vagtplan[i].ChaufforID == chaufforID) { 
                                        userIsAttachedToSchedule = true;
                                        break;
                                    }
                                }
                            }

                            if (userIsAttachedToSchedule) {
                                location.href = "fares.html";
                            }
                            else {
                                // Else show him the schedule so he can pick
                                CreateScheduleDropdown(vagtplan);

                                // Change screen to schedule
                                $(".login-view").slideUp(function () {

                                    $(".schedule-view").slideDown();

                                });
                            }                           
                            
                

                        } else {
                            // Sorry! No Web Storage support..
                            ShowAlert("Login mislykkedes", "Log ind oplysninger kan ikke gemmes i denne browser. Proev venligst en anden browser");
                        }

                    }
                },
                error: function (xhr, textStatus, errorThrown) {

                    ShowAlert("Fejl", errorThrown);
                }
            });

        }
        else {
            // Error message like. Internet connection is not available at the moment, will automatically try again in 2 min, or have a button "retry now"
            ShowAlert("Ingen internet forbindelse", "Internetforbindelsen er ikke tilgaengelig i oejeblikket. Proev igen om lidt");
        }
    }



    function CreateScheduleDropdown(vagtplan) {

        // Fill out schedule in dropdown                            
        var htmlSchedulePicker = "";

        for (var i = 0; i < vagtplan.length; i++) {

            var disabled = "";
            var disabledText = "";

            if (vagtplan[i].ChaufforID != 0) {
                disabled = "disabled";

                if (vagtplan[i].ChaufforNavn != null)
                    disabledText = " - optaget af " + vagtplan[i].ChaufforNavn;
            }
            else {
                disabledText = " - ledig"
            }


            htmlSchedulePicker += "<option " + disabled + " value='" + vagtplan[i].VagtID + "'>" + vagtplan[i].VognNavn + disabledText + "</option>";

        }
        $("#schedulePicker").html(htmlSchedulePicker);
    }


    function ShowAlert(title, message) {

        var $alert = $('#myModal');
        $alert.find("#modalTitle").html(title);
        $alert.find("#modalMessage").html(message);
        $alert.foundation('reveal', 'open');
    }


    function AddRememberedLoginInfo() {

        if (typeof (Storage) !== "undefined") {

            var company = localStorage.getItem('rdTaxaLoginCompany');
            var username = localStorage.getItem('rdTaxaLoginUsername');
            var password = localStorage.getItem('rdTaxaLoginPassword');

            $("#company").val(company);
            $("#username").val(username);
            $("#password").val(password);

        }

    }

    AddRememberedLoginInfo();

});