
var webserviceUrl = "TaxaWebservice.asmx";





// Webservice url
if (location.hostname.indexOf("ravno") > -1) {
    webserviceUrl = "/rdTaxa" + webserviceUrl + "/";
}

if (location.hostname.indexOf("test.ravno") > -1) {
    webserviceUrl = "/" + webserviceUrl + "/";
}



$(function () {


    FastClick.attach(document.body);


});




$(document).foundation({

    accordion: {
        // specify the class used for accordion panels
        content_class: 'content',
        // specify the class used for active (or open) accordion panels
        active_class: 'active',
        // allow multiple accordion panels to be active at the same time
        multi_expand: true,
        // allow accordion panels to be closed by clicking on their headers
        // setting to false only closes accordion panels when another is opened
        toggleable: true
    }
});



var isFaresPages = function () {
    if ($(".fares-page").length > 0) {
        // Retrieve the object from storage
        var user = sessionStorage.getItem('rdTaxaUser');

        if (user != null) {
            //WaitAnimation();
            //GetFaresByUser(user);

            CheckFares();

        }
        else {
            location.href = "login.html";
        }
    }
}


$('[data-login]').on('click', function (e) {
    e.preventDefault();
    VerifyUser();
});


$("[data-logout]").click(function () {
    sessionStorage.removeItem("rdTaxaUser");

    location.href = "login.html";
});


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

    if (firstRun) {
        tinysort('.custom-accordion ul li.accordion-item', { attr: 'data-starttime' });

    }

    var currentTime;


    if ($(".debug").length > 0) {
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

    //console.log(currentTime);
    var firstElementIndex = false;

    $(".custom-accordion ul li.accordion-item").each(function (index) {

        var arrivalTime = $(this).data("arrivaltime");

        if (arrivalTime != "Uangivet ankomsttid") {
            // If ArrivelTime exists
            $(this).removeClass("upcoming-fare");

            if (currentTime > arrivalTime) {
                $(this).addClass("passed");
            }
            else {
                $(this).removeClass("passed");

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

                if (currentTime > startTime) {
                    $(this).addClass("passed");
                }
                else {
                    $(this).removeClass("passed");

                    if (firstElementIndex == false) {
                        $(this).addClass("upcoming-fare");
                        firstElementIndex = true;
                    }
                }
            }
        }



    });
}


function VerifyUser() {
 
    // Check here if app is online
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



                        // TEST Hent Vogne

                        $.ajax({
                            type: "POST",
                            url: webserviceUrl + "/GetVogneByUser",
                            data: "{username:'" + username + "',password:'" + password + "',company:'" + company + "'}",
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function (result) {

                                var fares = JSON.parse(result.d);


                            }
                        })





                if (user == false) {
                    // myApp.hidePreloader();
                    // myApp.alert('Firma, Brugernavn, eller Adgangskode var forkert. <br />Verificer venligst dine login oplysninger og prøv igen. Tak!', 'Login mislykkedes');
                }
                else if (user == "System down") {
                    // myApp.hidePreloader();
                    // myApp.alert('Brugeren er deaktiveret. Kontakt venligst administrator eller kontaktperson for systemet for at åbne op.', 'Bruger deaktiveret');
                }
                else {

                    // Code for localStorage/sessionStorage.      
                    if (typeof (Storage) !== "undefined") {

                        var userString = JSON.stringify(user);
                        // Put the object into storage
                        sessionStorage.setItem('rdTaxaUser', userString)
                        // Redirect to fares page
                        location.href = "fares.html";

                    } else {
                        // Sorry! No Web Storage support..
                        //myApp.alert('Log ind oplysninger kan ikke gemmes i denne browser. Prøv venligst en anden browser', 'Login mislykkedes');
                    }


                    //console.log(user);
                    // Remove loader
                   // myApp.hidePreloader();


                }
            },
            error: function (e) {

                // Remove loader
                //myApp.hidePreloader();
                //myApp.popup(WebserviceErrorMessage(e));
            }
        });

    }
    else {
        // Error message like. Internet connection is not available at the moment, will automatically try again in 2 min, or have a button "retry now"
        // myApp.alert('Internetforbindelsen er ikke tilgængelig i øjeblikket. Prøv igen om lidt', 'Ingen internet forbindelse');
    }
}


function HTMLFares() {
    // Retrieve the object from storage
    var faresSession = localStorage.getItem('rdTaxaFares');
    var fares = JSON.parse(faresSession);

    var htmlFare = '';

    for (var i = 0; i < fares.length; i++) {

        htmlFare += '<li class="accordion-item ';

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
        htmlFare += '<a href="#" class="item-link item-content">';
        htmlFare += '<div class="item-inner">';
        htmlFare += '<div class="item-title">';

        htmlFare += '<div class="time"><i class="fi-check"></i>';

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
        //else {
        //    htmlFare += ' - ?';
        //}



        htmlFare += '</div>';



        // Vogn nummer til header
        if ($(".header .company").text().length == 0) {
            var vognNummer = fares[i].VognNummer;

            if (vognNummer != null) {
                if (vognNummer != "") {
                    $(".header .company").text(fares[i].VognNummer);
                }
            }
        }



        // Steder
        //htmlFare += '<div class="places"><i class="fi-marker"></i> Opsamlinger: ' + numPlaces + "</div>";


        if (fares[i].ListPassengers != null) {
            //var numPassengers = fares[i].ListPassengers.length;
            //var passengersText = "<i class='fi-torso'></i> Passager";

            //if (numPassengers > 1)
            //    passengersText = "<i class='fi-torsos-all'></i> Passagerer";

            htmlFare += '<div class="passengersAmount"><i class="fi-torsos-all"></i> Passagerer: ' + fares[i].ListPassengers.length + '</div>';
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





        htmlFare += '</div>';
        htmlFare += '</div>';
        htmlFare += '</a>';
        htmlFare += '<div class="accordion-item-content">';
        htmlFare += '<div class="list-block">';
        htmlFare += '<ul>';




        if (fares[i].ListPassengers.length > 0) {
            htmlFare += '<li>';
            htmlFare += '<div class="item-content">';
            htmlFare += '<div class="item-inner">';
            htmlFare += '<div class="item-title">Detaljer:<br />';

            for (var j = 0; j < fares[i].ListPassengers.length; j++) {

                var passengerStatus = fares[i].ListPassengers[j].Status;
                //passengerStatus = 1;


                var statusClass = "";

                if (passengerStatus == 1) {
                    statusClass += ' status-cancelled ';
                }
                else if (passengerStatus == 2) {
                    statusClass += ' status-absent ';
                }
                else if (passengerStatus == 3) {
                    statusClass += ' status-noshow ';
                }

                // Tid
                var afgangstid = fares[i].ListPassengers[j].Afgangstid;
                var ankomsttid = fares[i].ListPassengers[j].AnkomstTid;


                htmlFare += '<div class="passenger-time' + statusClass + '">'

                if (afgangstid != null) {
                    htmlFare += afgangstid;
                }

                if (ankomsttid != null) {
                    htmlFare += " - " + ankomsttid;
                }
                //else {
                //    htmlFare += " - ?";
                //}


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
                        htmlFare += '<div class="remarks"><b>Bemærkning:</b><br /><i>"' + bemarkning + '"</i>' + "</div>";
                }
                htmlFare += "</div>";


            }

            htmlFare += '</div>';
            htmlFare += '</div>';
            htmlFare += '</div>';
            htmlFare += '</li>';
        }



        htmlFare += '</ul>';
        htmlFare += '</div>';
        htmlFare += '</div>';
        htmlFare += '</li>';
    }

    // No fares
    if (fares.length == 0) {
        htmlFare += "<li class='accordion-item' ><div class='item-inner'><div class='item-title'>Ingen køreture er planlagt for dig idag</div></div></li>";
    }


    // Add fares to list
    $(".custom-accordion ul").html("");
    $(".custom-accordion ul").append(htmlFare);


    // Update order of fares
    UpdateFaresAccordingToTime();

}



function GetFaresByUser(user)
{
    var userJSON = JSON.parse(user);

    var company = userJSON.CustID;
    var username = userJSON.UserNavn;
    var password = userJSON.Password;

    $.ajax({
        type: "POST",
        url: webserviceUrl + "/GetFaresByUser",
        data: "{username:'" + username + "',password:'" + password + "',company:'" + company + "'}",
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

            $(".fares-timestamp").html("Sidst tjekket<br />kl " + currentTime.getHours() + ":" + minutes);

            var timeStampObject = { timestamp: currentTime };  // Put timestamp into storage


            // Render list fares on first run
            if (firstRun) {

                localStorage.setItem('rdTaxaFares', faresString);
                localStorage.setItem('rdTaxaFaresTimestamp', JSON.stringify(timeStampObject));

                HTMLFares();


                // Firma navn
                //$(".header .company").text("Vogn " + companyName);

                // Insert title of drivers schedule
                var currentDate = new Date().toLocaleDateString().replace("/.*(\d{2}:\d{2}:\d{2}).*/", "$1");
                $(".fares-title").html("Dagens køreplan <br />" + GetDayName() + " " + currentDate);

                firstRun = false;
            }
            else {
                // Interval Check
                // Compare new fares vs old fares. Has anything changed.
                // If yes, then update the list
                var oldFares = localStorage.getItem('rdTaxaFares');

                console.log("checking");

                // Only update fares cache if it is different
                if (faresString != oldFares) {

                    localStorage.setItem('rdTaxaFares', faresString);
                    localStorage.setItem('rdTaxaFaresTimestamp', JSON.stringify(timeStampObject));

                    // Output Fares to HTML
                    HTMLFares();



                }
                else {
                    UpdateFaresAccordingToTime();
                }
            }

            // Remove loader
            // myApp.hidePreloader();



            setTimeout(function () { CheckFares(); }, updateTimer);

        },
        error: function (e) {

            // Remove loader
            //myApp.hidePreloader();
            //myApp.popup(WebserviceErrorMesssage(e));
        }
    });

}

function GetDayName() {
    var gsDayNames = new Array(
               'Søndag',
               'Mandag',
               'Tirsdag',
               'Onsdag',
               'Torsdag',
               'Fredag',
               'Lørdag'
             );

    var d = new Date();
    var dayName = gsDayNames[d.getDay()];

    return dayName;
}

function CheckFares() {

    // Check here if app is online
    if (navigator.onLine) {
        var user = sessionStorage.getItem('rdTaxaUser');

        if (user != null) {

            GetFaresByUser(user);
        }
    }
    else {
        // Error message like. Internet connection is not available at the moment, will automatically try again in 2 min, or have a button "retry now"
        //setTimeout(CheckFares(), 60000); // 1 min


        //myApp.alert('Internetforbindelsen er ikke tilgængelig i øjeblikket. Prøv igen om lidt', 'Ingen internet forbindelse');

        UpdateFaresAccordingToTime();
    }



}


//isFaresPages();