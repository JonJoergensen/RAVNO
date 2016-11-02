using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace RDTaxa
{
    public class Fare
    {

        private string vognNummer;

        public string VognNummer
        {
            get { return vognNummer; }
            set { vognNummer = value; }
        }

        private int koreTurID;

        public int KoreTurID
        {
            get { return koreTurID; }
            set { koreTurID = value; }
        }

        private string afgangstid;

        public string Afgangstid
        {
            get { return afgangstid; }
            set { afgangstid = value; }
        }
        private string ankomstTid;

        public string AnkomstTid
        {
            get { return ankomstTid; }
            set { ankomstTid = value; }
        }
        private string afgangssted;

        public string Afgangssted
        {
            get { return afgangssted; }
            set { afgangssted = value; }
        }
        private string ankomststed;

        public string Ankomststed
        {
            get { return ankomststed; }
            set { ankomststed = value; }
        }
        private string bemarkning;

        public string Bemarkning
        {
            get { return bemarkning; }
            set { bemarkning = value; }
        }
        private int status;

        public int Status
        {
            get { return status; }
            set { status = value; }
        }

        private string timestamp;
        public string TimeStamp
        {
            get { return timestamp; }
            set { timestamp = value; }
        }

       private List<Passenger> listPassengers = new List<Passenger>();

        public List<Passenger> ListPassengers
        {
            get { return listPassengers; }
            set { listPassengers = value; }
        }

    }

    public class Passenger
    {

        private int passagerID;
        private int koreTurID;
        private string kunde;
        private string bemarkning;
        private string bagage;
        private int status;
        private string afgangstid;
        private string ankomstTid;
        private string afgangssted;
        private string ankomststed;
        private string timestamp;

        public int PassagerID
        {
            get { return passagerID; }
            set { passagerID = value; }
        }

        public int KoreTurID
        {
            get { return koreTurID; }
            set { koreTurID = value; }
        }

        public string Kunde
        {
            get { return kunde; }
            set { kunde = value; }
        }

        public string Bemarkning
        {
            get { return bemarkning; }
            set { bemarkning = value; }
        }

        public string Bagage
        {
            get { return bagage; }
            set { bagage = value; }
        }

        public int Status
        {
            get { return status; }
            set { status = value; }
        }


        public string Afgangstid
        {
            get { return afgangstid; }
            set { afgangstid = value; }
        }

        public string AnkomstTid
        {
            get { return ankomstTid; }
            set { ankomstTid = value; }
        }


        public string Afgangssted
        {
            get { return afgangssted; }
            set { afgangssted = value; }
        }

        public string Ankomststed
        {
            get { return ankomststed; }
            set { ankomststed = value; }
        }

       public string TimeStamp
        {
            get { return timestamp; }
            set { timestamp = value; }
        }   
    }

    public class User
    {
        private string userID;
        private string userNavn;
        private string password;
        private string custID;
        private string loginTime;
        private string chaufforID;
        private string connection;
        private string custNavn;
        private string version;
        private int driftStatus;


        public string UserNavn
        {
            get { return userNavn; }
            set { userNavn = value; }
        }

        public string Password
        {
            get { return password; }
            set { password = value; }
        }

        public string LoginTime
        {
            get { return loginTime; }
            set { loginTime = value; }
        }

        public string ChaufforID
        {
            get { return chaufforID; }
            set { chaufforID = value; }
        }

        public string Connection
        {
            get { return connection; }
            set { connection = value; }
        }

        public string CustNavn
        {
            get { return custNavn; }
            set { custNavn = value; }
        }

        public string CustID
        {
            get { return custID; }
            set { custID = value; }
        }

        public int DriftStatus
        {
            get { return driftStatus; }
            set { driftStatus = value; }
        }

        public string Version
        {
            get { return version; }
            set { version = value; }
        }

        public string UserID
        {
            get { return userID; }
            set { userID = value; }
        }



    }

    public class Vagt
    {
        private int vagtID;
        public int VagtID
        {
            get { return vagtID; }
            set { vagtID = value; }
        }

        private int vognID;
        public int VognID
        {
            get { return vognID; }
            set { vognID = value; }
        }

        private string vognnavn;
        public string VognNavn
        {
            get { return vognnavn; }
            set { vognnavn = value; }
        }

        private int chaufforID;
        public int ChaufforID
        {
            get { return chaufforID; }
            set { chaufforID = value; }
        }

        private string chauffornavn;
        public string ChaufforNavn
        {
            get { return chauffornavn; }
            set { chauffornavn = value; }
        }

    }

}