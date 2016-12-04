/*global define:false, Modernizr:false */
define(['jquery', 'tinysort', 'howler'], function ($, tinysort, howler) {
    //'use strict';

  
    var firstRun = true;
    var updateTimer = 60 * 1000;
    var webserviceUrl = "TaxaWebservice.asmx";
    var vagtID = null;
    var sound;
    var playFareChangeSound = false;

    // Webservice url
    if (location.hostname.indexOf("test.ravno") > -1 || location.hostname.indexOf("taxaplan.ravno") > -1) {
        webserviceUrl = webserviceUrl;        
    }
    else if (location.hostname.indexOf("ravno") > -1) {
        webserviceUrl = "/rdTaxa/" + webserviceUrl;
    }





    $("[data-logout]").click(function () {
  
        
        if (vagtID != null) {

            var company = localStorage.getItem('rdTaxaLoginCompany');
            var username = localStorage.getItem('rdTaxaLoginUsername');
            var password = localStorage.getItem('rdTaxaLoginPassword');


            $.ajax({
                type: "POST",
                url: webserviceUrl + "/checkudVagt",
                data: "{username:'" + username + "',password:'" + password + "',company:'" + company + "',vagtID:'" + vagtID + "'}",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {

                    var result = JSON.parse(result.d);

                    if (result == true) {

                        // Clear storage
                        ClearStorage();

                        //ShowAlert("Tak", "Din vagt er frigivet og du er nu logget ud. Du bliver omstillet til forsiden...");

                        setTimeout(function () {
                            location.href = "login.html";

                        }, 200);

                    }
                    else {
                        ShowAlert("Fejl", "Din brugers vagt blev ikke frigivet korrekt. <br />Til reference var dine logud informationer. Brugernavn: " + username + " Adgangskode: " + password + " Firma: " + company + " VagtID: " + vagtID + "<br />Du bliver nu omstillet til forsiden...");


                        setTimeout(function () {
                            location.href = "login.html";
                        }, 7000);

                    }

        

                },
                error: function (xhr, textStatus, errorThrown) {


                    ShowAlert("Fejl", textStatus + errorThrown);
                }
            });

        }
        else {

            ClearStorage();

            ShowAlert("Tak", "Du er ikke på nogen vagt, og er nu logget ud. Du bliver omstillet til forsiden...");


            setTimeout(function () {
                // Redirect
                location.href = "login.html";

            }, 5000);

        }
               


    });



 


    var isFaresPages = function () {

        if ($(".fares-page").length > 0) {
            // Retrieve the object from storage
            var userName = localStorage.getItem('rdTaxaLoginUsername');

            if (userName != null)
            {            
                CheckFares();

                // Get Fares Every 60 seconds
                setInterval(function () { CheckFares(); }, updateTimer);


                LoadSounds();               

      
                ShowWelcomeMessage();

            }
            else {
                location.href = "login.html";
            }
        }
    }


    isFaresPages();


    // DatePicker event 
    $(document).on("change", "#datePicker", function () {
               
        firstRun = true;
        CheckFares();
    });



    function CreateDatePicker(dayObj) {
        
        var html = "";

            
        for (var i = -7; i < 7; i++) {

            var date = new Date(dayObj);
            var newdate = new Date(date);

            newdate.setDate(newdate.getDate() + i);

            var dd = newdate.getDate();
            var mm = newdate.getMonth() + 1;
            var y = newdate.getFullYear();
                
            var someFormattedDate = dd + '/' + mm + '/' + y;          
         
            // Todays date
            if (date.getDate() == newdate.getDate())
            {
                html += "<option id='dateToday' value='" + someFormattedDate + "' selected>" + "Idag" + " " + someFormattedDate + "</option>";
            }
            else {
                // Other days
                html += "<option value='" + someFormattedDate + "'>" + GetDayName(newdate) + " " + someFormattedDate + "</option>";
            }            
        }

        $("#datePicker").html(html);
    }







    function CounterRefresh(counter, counterStart) {
        if (counter == 0) {
            CheckFares();
            counter = counterStart;
        }
        counter--;
        $(".refresh-timer").text("" + counter);

        setTimeout("CounterRefresh(" + counter + "," + counterStart + ");", 1000);
    }


    function UpdateFaresAccordingToTime() {
        // Sorter listen efter tid

        if ($("[data-accordion] .accordion-navigation").length > 0)
        {
            tinysort('[data-accordion] .accordion-navigation', { attr: 'data-starttime' });


            var currentTime;


            if ($(".debug").length > 0) {
                currentTime = $(".selector-time").val();
                //currentTime = now.getHours() + ':' + now.getMinutes();
            }
            else {
                var now = new Date();

                var hours = now.getHours();
                if (hours < 10) {
                    hours = "0" + hours;
                }
                var minutes = now.getMinutes();
                if (minutes < 10) {
                    minutes = "0" + minutes;
                }                                

                currentTime = hours + ':' + minutes;
            }

            var firstElementIndex = false;                       

            // Todays date
            var dd = now.getDate();
            var mm = now.getMonth() + 1;
            var y = now.getFullYear();            
            var todaysDate = new Date(y, mm, dd, now.getHours(), now.getMinutes());
        

            // Selected date
            var selectedDateStr = $("#datePicker").val();
            var selectedDateArr = selectedDateStr.split('/');            
            var selectedDay = selectedDateArr[0];
            var selectedMonth = selectedDateArr[1];
            var selectedYear = selectedDateArr[2];
        

            $("[data-accordion] .accordion-navigation").each(function (index) {

                var arrivalTime = $(this).data("arrivaltime");

                if (arrivalTime != "Uangivet ankomsttid") {
                 
                        
                    // If ArrivelTime exists
                    $(this).removeClass("upcoming-fare");


                    // Format Arrival time into a date, so that it can be compared in javascript
                    var arrivalTimeArr = arrivalTime.split(':');
                    var arrivalHour = arrivalTimeArr[0];
                    var arrivalMinute = arrivalTimeArr[1];
                    var arrivalDateTime = new Date(selectedYear, selectedMonth, selectedDay, arrivalHour, arrivalMinute);
                    
                    // Add "passed" class if current time is more than arrival time
                    if (todaysDate > arrivalDateTime) {

                        // Only add status-passed if there is not other status before
                        if ($(this).hasClass("status-cancelled") == false) {
                            $(this).addClass("status-passed");
                        }                      
                    }
                    else {
                        $(this).removeClass("status-passed");

                        if (firstElementIndex == false) {
                            $(this).addClass("upcoming-fare");
                            firstElementIndex = true;
                        }
                    }
                }
                else {

                    // If arrivaltime does not exist
                    var startTime = $(this).data("starttime");

                    if (startTime != null) {

                        // Format Arrival time into a date, so that it can be compared in javascript
                        var startTimeArr = startTime.split(':');
                        var startHour = startTimeArr[0];
                        var startMinute = startTimeArr[1];
                        var startDateTime = new Date(selectedYear, selectedMonth, selectedDay, startHour, startMinute);

                        // Add "status-passed" class if current time is more than start time
                        if (todaysDate > startDateTime) {

                            // Only add status-passed if there is not other status before
                            if ($(this).hasClass("status-cancelled") == false) {
                                $(this).addClass("status-passed");
                            }
                        }
                        else {
                            $(this).removeClass("status-passed");

                            if (firstElementIndex == false) {
                                $(this).addClass("upcoming-fare");
                                firstElementIndex = true;
                            }
                        }
                    }
                }
            });
                                 
        }        
    }

    
    function FindFareChanges(latestFaresString) {

        // parse string to object
        var latestFares = JSON.parse(latestFaresString);

        // Get and parse current fares to object
        var currentFaresString = localStorage.getItem('rdTaxaFares');
        var currentFares = JSON.parse(currentFaresString);

        // Loop through lates fares to find any that matches with currentFares
        for (var i = 0; i < latestFares.length; i++) {

            var latestFareTimestamp = latestFares[i].TimeStamp;
            var latestFareKoreTurID = latestFares[i].KoreTurID;

            var matchFound = false;

            // Find matching fares with a current fare 
            for (var j = 0; j < currentFares.length; j++) {

                var currentFareTimestamp = currentFares[j].TimeStamp;
                var currentFareKoreTurID = currentFares[j].KoreTurID;

                // Found
                if(latestFareTimestamp == currentFareTimestamp && latestFareKoreTurID == currentFareKoreTurID)
                {
                    matchFound = true;
                    break; 
                }
            }

            // If no match could be found then this is an updated fare or a new fare
            if(matchFound == false)
            {
                latestFares[i].IsUpdated = true;

                
                playFareChangeSound = true;
            }
        }

        // Stringify it again
        var latestFaresString = JSON.stringify(latestFares);

        return latestFaresString;
    }

    

    function HTMLFares() {
        // Retrieve the object from storage
        var faresSession = localStorage.getItem('rdTaxaFares');
        var fares = JSON.parse(faresSession);

        var htmlFare = '';

        for (var i = 0; i < fares.length; i++)
        {
            htmlFare += '<li class="accordion-navigation ';

            // Add status
            if (fares[i].Status == 1) {
                htmlFare += ' status-cancelled ';
            }
            else if (fares[i].Status == 2) {
                htmlFare += ' status-absent ';
            }
            else if (fares[i].Status == 3) {
                htmlFare += ' status-noshow ';
            }
            
            // Add class if the fare is new or has been updated
            if (fares[i].IsUpdated == true) {

                htmlFare += ' status-updated ';
            }


            htmlFare += '" ';


            // Afgangstid
            if (fares[i].Afgangstid != null) {
                htmlFare += ' data-starttime="' + fares[i].Afgangstid + '" ';
            }
            else {
                htmlFare += ' data-starttime="24:00" ';
            }


            // Ankomsttid
            if (fares[i].AnkomstTid != null) {
                htmlFare += ' data-arrivaltime="' + fares[i].AnkomstTid + '" ';
            }
            else {
                htmlFare += ' data-arrivaltime="Uangivet ankomsttid" ';
            }


            htmlFare += '>';
            htmlFare += '<a href="#fare' +  i + '" class="item-link">';

            htmlFare += '<div class="time left"><i class="fi-check"></i><i class="fi-prohibited"></i>';

            // Afgangstid
            if (fares[i].Afgangstid != null) {
                htmlFare += fares[i].Afgangstid;
            }
            else {
                htmlFare += "Ingen starttid på tur";
            }

            // Ankomsttid
            if (fares[i].AnkomstTid != null) {
                htmlFare += ' - ' + fares[i].AnkomstTid;
            }

            htmlFare += '</div>';
            

            // Steder
            //htmlFare += '<div class="places"><i class="fi-marker"></i> Opsamlinger: ' + numPlaces + "</div>";


            if (fares[i].ListPassengers != null) {
                //var numPassengers = fares[i].ListPassengers.length;
                //var passengersText = "<i class='fi-torso'></i> Passager";

                //if (numPassengers > 1)
                //    passengersText = "<i class='fi-torsos-all'></i> Passagerer";

                htmlFare += '<div class="passengersAmount right"><i class="fi-torsos-all"></i> Passagerer: ' + fares[i].ListPassengers.length + '</div>';
            }

            
            var fareStart = fares[i].Afgangssted;
            var fareEnd = fares[i].Ankomststed;


            var numPlaces = 0;

            if (fareStart != "" && fareStart != null) {

                htmlFare += '<div class="first-pickup"><i class="fi-marker"></i> ' + fareStart + "</div>";
                numPlaces++;
            }


            if (fareEnd != "" && fareEnd != null) {

                htmlFare += '<div class="last-destination"><i class="fi-flag"></i> ' + fareEnd + "</div>";
                numPlaces++;
            }

            htmlFare += '</div>';

            // Show all stops in the list if there are more passengers
            if (fares[i].ListPassengers.length > 0) {
                for (var k = 0; k < fares[i].ListPassengers.length; k++) {
                    if (fares[i].ListPassengers[k].Status === 0) {
                        // Passenger pickup
                        var passengerPickup = fares[i].ListPassengers[k].Afgangssted;

                        if (fareStart != passengerPickup) {
                            numPlaces++;
                        }

                        // Passenger Destination
                        //var passengerDestination = fares[i].ListPassengers[k].Ankomststed;

                        //if (fareEnd != passengerDestination) {
                        //    numPlaces++;
                        //}
                    }
                }
            }
                  

            htmlFare += '<i class="fi-plus"></i>';
            htmlFare += '<i class="fi-minus"></i>';
            htmlFare += '</a>';
            htmlFare += '<div id="fare' + i + '" class="content">';

            var totalPassengers = fares[i].ListPassengers.length;

            if (fares[i].ListPassengers.length > 0) {
             
                htmlFare += '<div class="item-content"><span class="details">Alle detaljer:</span><br />';

                for (var j = 0; j < fares[i].ListPassengers.length; j++) {

                    var passengerStatus = fares[i].ListPassengers[j].Status;
                    //passengerStatus = 1;


                    var statusClass = '';
                    var statusText = '';

                    if (passengerStatus == 1) {
                        statusClass += ' status-cancelled ';
                        statusText = 'Aflyst';
                        totalPassengers--;
                    }
                    else if (passengerStatus == 2) {
                        statusClass += ' status-absent ';
                        statusText = 'Udeblevet';
                    }
                    else if (passengerStatus == 3) {
                        statusClass += ' status-noshow ';
                        statusText = 'Forgaeves';
                    }

                    // Tid
                    var afgangstid = fares[i].ListPassengers[j].Afgangstid;
                    var ankomsttid = fares[i].ListPassengers[j].AnkomstTid;


                    htmlFare += '<div class="passenger-time' + statusClass + '">'

                    if (statusText != "") {
                        htmlFare += '<span class="status-text">' + statusText + '</span>';
                    }

                    if (afgangstid != null) {
                        htmlFare += afgangstid;
                    }

                    if (ankomsttid != null) {
                        htmlFare += " - " + ankomsttid;
                    }
      

                    htmlFare += "</div>";
                    htmlFare += "<div class='passenger-info" + statusClass + "'>";


                    // Afgangssted
                    var afgangssted = fares[i].ListPassengers[j].Afgangssted;
                    if (afgangssted != null) {
                        htmlFare += '<div class="pickup"><i class="fi-marker"></i> ' + afgangssted + "</div>";
                    }


                    // Ankomststed
                    var ankomststed = fares[i].ListPassengers[j].Ankomststed;
                    if (ankomststed != null) {
                        htmlFare += '<div class="destination"><i class="fi-flag"></i> ' + ankomststed + "</div>";;
                    }


                    var kunde = fares[i].ListPassengers[j].Kunde;
                    if (kunde != null)
                        htmlFare += '<div class="passenger"><i class="fi-torso"></i> ' + kunde + "</div>";

                    // Bagage
                    var bagage = fares[i].ListPassengers[j].Bagage;

                    if (bagage != null) {
                        if (bagage != "")
                            htmlFare += '<div class="bagage"><i class="fi-info"></i> ' + bagage + "</div>";
                    }

                    // Bemærkning
                    var bemarkning = fares[i].ListPassengers[j].Bemarkning;

                    if (bemarkning != null) {
                        if (bemarkning != "")
                            htmlFare += '<div class="remarks"><b>NB:</b> <i>"' + bemarkning + '"</i>' + "</div>";
                    }

                    htmlFare += "</div>";
                }
                htmlFare += '</div>';
            }

            htmlFare += '</div>';
            htmlFare += '</li>';
        }        



        // Add fares to list
        $("[data-accordion]").html("");
        $("[data-accordion]").append(htmlFare);


        // Update order of fares
        UpdateFaresAccordingToTime();

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

                     
                            for (var i = 0; i < vagtplan.length; i++) {

                                if (vagtplan[i].ChaufforID == chaufforID) {
                                    
                                }
                            }


                        } else {
                            // Sorry! No Web Storage support..
                            ShowAlert("Login mislykkedes", "Log ind oplysninger kan ikke gemmes i denne browser. Proev venligst en anden browser");
                        }

                    }
                },
                error: function (xhr, textStatus, errorThrown) {


                    ShowAlert("Fejl", textStatus + errorThrown);
                }
            });

        }
        else {
            // Error message like. Internet connection is not available at the moment, will automatically try again in 2 min, or have a button "retry now"
            ShowAlert("Ingen internet forbindelse", "Internetforbindelsen er ikke tilgaengelig i oejeblikket. Proev igen om lidt");
        }
    }


    function GetFaresByVagt(date) {
                

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
                            
                            // Sinec we store vagtID on the client side, we need to set it to null to ensure that the vagtID is still assigned from the server
                            vagtID = null;

      
                            // Check if user is already attached to a schedule, and if true direct him to it
                            if (chaufforID != null) {

                                for (var i = 0; i < vagtplan.length; i++) {

                                    if (vagtplan[i].ChaufforID == chaufforID) {                                      
                                        vagtID = vagtplan[i].VagtID;



                                        // Vogn nummer til header
                                        if ($(".farename").text().length == 0) {
                                            var vognNavn = vagtplan[i].VognNavn;

                                            if (vognNavn != null) {
                                                if (vognNavn != "") {
                                                    $(".farename").text(vognNavn);
                                                }
                                            }
                                        }


                                    }
                                }
                            }

                            if(vagtID != null){

                                $.ajax({
                                    type: "POST",
                                    url: webserviceUrl + "/GetFaresByVagt",
                                    data: "{username:'" + username + "',password:'" + password + "',company:'" + company + "',date:'" + date + "',VagtID:'" + vagtID + "'}",
                                    contentType: "application/json; charset=utf-8",
                                    dataType: "json",
                                    success: function (result) {
                                      
                              
                                        var fares = JSON.parse(result.d);
                     

                                        // Save to local storage
                                        var faresString = JSON.stringify(fares); // Put fares into storage      
                                       
                                        var currentTime = new Date(); //.toLocaleTimeString().replace("/:*(\d{2}:\d{2}:\d{2}):*/", "$1");
                                        var minutes = currentTime.getMinutes();
                                        if (minutes < 10) {
                                            minutes = "0" + minutes;
                                        }

                                        $(".fares-timestamp").html("SIDST TJEKKET kl " + currentTime.getHours() + ":" + minutes);

                                        var timeStampObject = { timestamp: currentTime };  // Put timestamp into storage


                                        // Output fares Text 
                                        if (fares.length == 0)
                                        {
                                            $("[data-no-fares-date]").text($("#datePicker option:selected").text());
                                            $(".no-fares").removeClass("hide");
                                        }
                                        else {
                                            $(".no-fares").addClass("hide");
                                        }



                                        // Render list fares on first run
                                        if (firstRun == true) {
                                 
                                            localStorage.setItem('rdTaxaFares', faresString);
                                            localStorage.setItem('rdTaxaFaresTimestamp', JSON.stringify(timeStampObject));

                                            HTMLFares();                                            
                   
                                            firstRun = false;
                                        }
                                        else {                            

                                            // Interval Check
                                            // Compare new fares vs old fares. Has anything changed.
                                            // If yes, then update the list
                                            var oldFares = localStorage.getItem('rdTaxaFares');

                                            // Only update fares cache if it is different
                                            if (faresString != oldFares) {
                                                                                          
                                                faresString = FindFareChanges(faresString);

                                          

                                                localStorage.setItem('rdTaxaFares', faresString);
                                                localStorage.setItem('rdTaxaFaresTimestamp', JSON.stringify(timeStampObject));

                                                // Output Fares to HTML
                                                HTMLFares();


                                                // Play fare change sound if anything has changed
                                                if (playFareChangeSound == true)
                                                {
                                                    sound.play();
                                                    playFareChangeSound = false;
                                                }                                                

                                            }
                                            else {
                                                UpdateFaresAccordingToTime();
                                            }
                                        }

                                        
                                    },
                                    error: function (e) {
                                        ShowAlert('Error', JSON.stringify(e));
                                    }
                                });
                            }
                            else {


                                // The administration has taken the user off the schedule, so we are going to log him out, display a message and return to login
                                $("[data-logout]").click();
                                
                            }

                        }

                    }
                },
                error: function (xhr, textStatus, errorThrown) {

                    ShowAlert("Fejl", textStatus + errorThrown);
                }
            });       

    }

    function GetDayName(date) {
        var gsDayNames = new Array(
                   'Søndag',
                   'Mandag',
                   'Tirsdag',
                   'Onsdag',
                   'Torsdag',
                   'Fredag',
                   'Lørdag'
                 );
          
        var dayName = gsDayNames[date.getDay()];

        return dayName;
    }




    function CheckFares() {

        // Check here if app is online
        if (navigator.onLine) {
            var userName = localStorage.getItem('rdTaxaLoginUsername');

            if (userName != null) {

                // Get date
                var date = $("#datePicker").val();
        

                // If date is not found, start with todays date and create the Date Picker
                if (date == null)
                {
               
                    var dateObj = new Date();
                    CreateDatePicker(dateObj);

                    // set date
                    date = $("#datePicker #dateToday").attr("value");              
                }


                //Get vagtID and show fares ny vagt
                 
                 GetFaresByVagt(date);
              
               
            }
            else {
                location.href = "login.html";
            }
        }
        else {
            // Error message like. Internet connection is not available at the moment, will automatically try again in 2 min, or have a button "retry now"
            //setTimeout(CheckFares(), 60000); // 1 min

            ShowAlert('Ingen internet forbindelse', 'Internetforbindelsen er ikke tilgaengelig i oejeblikket. Proev igen om lidt');

            UpdateFaresAccordingToTime();
        }



    }

    function ShowAlert(title, message) {

        var $alert = $('#myModal');
        $alert.find("#modalTitle").html(title);
        $alert.find("#modalMessage").html(message);
        $alert.foundation('reveal', 'open');
    }

    function ShowWelcomeMessage()
    {
        var title = "Goddag";


        var now = new Date();

        var hours = now.getHours();
        if (hours <= 9) {
            title = "Godmorgen";
        }
        if (hours > 9 && hours <= 12) {
            title = "God formiddag";
        }
        if (hours > 12 && hours <= 18) {
            title = "God eftermiddag";
        }
        if (hours > 18) {
            title = "Godaften";
        }

        title = title + " og velkommen"


        var message = "Her kan du se din køreplan for idag og andre dage. Kør forsigtigt og god tur.<br /><br />";
        message += "<button id='welcomeButton' onclick=\"javascript:$('#myModal').foundation('reveal', 'close');\" class='button'>Se køreplan</button>";

        
        ShowAlert(title, message);


        //$("body").on("click", "#welcomeButton", function () {

        //    $('#myModal').foundation('reveal', 'close');
        //});

       

    }


    function ClearStorage() {
        localStorage.removeItem('rdTaxaLoginCompany');
        localStorage.removeItem('rdTaxaLoginUsername');
        localStorage.removeItem('rdTaxaLoginPassword');
        localStorage.removeItem('rdTaxaLoginChaufforID');

    }

    function LoadSounds() {

        var soundFolder = "/resources/images/sounds/";

        sound = new Howl({
            src: [soundFolder + 'oringz-w424.mp3', soundFolder + 'oringz-w424.ogg'],
            preload: true,
            autoplay: false,
            volume: 1.0
        });
          
    }




    


  
});