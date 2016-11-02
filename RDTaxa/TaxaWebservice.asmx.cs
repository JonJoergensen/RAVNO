using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Web.Script.Services;
using System.Web.Services;

namespace RDTaxa
{
    /// <summary>
    /// Summary description for TaxaWebservice
    /// </summary>
    [WebService(Namespace = "http://tempuri.org/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    [System.ComponentModel.ToolboxItem(false)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
     [System.Web.Script.Services.ScriptService]
    public class TaxaWebservice : System.Web.Services.WebService
    {

        [WebMethod(EnableSession = true)]
        [ScriptMethod(UseHttpGet = false, ResponseFormat = ResponseFormat.Json)]
        public string VerifyUser(string username, string password, string company)
        {


            JavaScriptSerializer js = new JavaScriptSerializer();
            string strJSON;

            string connectionString = ConfigurationManager.ConnectionStrings["Conn"].ToString();

            string queryString = "SELECT [User].UserID, [User].UserNavn, [User].Password, [User].LoginTime, [User].ChaufforID, [User].CustID, Cust.Connection, Cust.CustNavn, Cust.DriftStatus, Cust.Version";
            queryString += " FROM [User] INNER JOIN Cust ON [User].CustID = Cust.CustID";
            queryString += " WHERE UserNavn = '" + username + "' AND Password = '" + password + "' AND Cust.CustID = '" + company + "';";

            User user = null;
            List<Fare> ListFares = new List<Fare>();

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {

                    SqlCommand command = new SqlCommand(queryString, connection);
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();

                    while (reader.Read())
                    {
                        user = new User();
                        user.UserID = reader["UserID"].ToString();
                        user.UserNavn = reader["UserNavn"].ToString();
                        user.Password = reader["Password"].ToString();
                        user.LoginTime = reader["LoginTime"].ToString();
                        user.ChaufforID = reader["ChaufforID"].ToString();
                        user.Connection = reader["Connection"].ToString();
                        user.CustID = reader["CustID"].ToString();
                        user.CustNavn = reader["CustNavn"].ToString();

                        if (!String.IsNullOrWhiteSpace(reader["DriftStatus"].ToString()))
                            user.DriftStatus = int.Parse(reader["DriftStatus"].ToString());

                        user.Version = reader["Version"].ToString();
                    }
                }
                catch (Exception e)
                {
                    string error = e.ToString();
                }
                finally
                {
                }
            }

            //Analyse user data
            if (user != null)
            {
                if (user.DriftStatus < 3)
                {
                    strJSON = js.Serialize(user);

                }
                else
                {
                    // Hvis Cust.DriftStatus < 3 er alt OK  (Cust.DriftStatus = 3 betyder, at systemet er lukket.)
                    strJSON = js.Serialize("User disabled");
                }
                
            }
            else
            {
                // Return false if user does not exist
                strJSON = js.Serialize(false);
            }

            return strJSON;
        }

        [WebMethod(EnableSession = true)]
        [ScriptMethod(UseHttpGet = false, ResponseFormat = ResponseFormat.Json)]
        public string GetFaresByVagt(string username, string password, string company, string date, decimal VagtID)
        {


            DateTime dateFares = new DateTime(DateTime.Now.Year, DateTime.Now.Month, DateTime.Now.Day);

            if (!string.IsNullOrWhiteSpace(date))
            {
                dateFares = DateTime.Parse(date);
            }


            JavaScriptSerializer js = new JavaScriptSerializer();
            string strJSON;

            string connectionString = ConfigurationManager.ConnectionStrings["Conn"].ToString();

            string queryString = "SELECT [User].UserID, [User].UserNavn, [User].LoginTime, [User].ChaufforID, Cust.Connection, Cust.CustNavn, Cust.DriftStatus, Cust.Version";
            queryString += " FROM [User] INNER JOIN Cust ON [User].CustID = Cust.CustID";
            queryString += " WHERE UserNavn = '" + username + "' AND Password = '" + password + "' AND Cust.CustID = '" + company + "';";

            User user = null;
            List<Fare> ListFares = new List<Fare>();

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {

                    SqlCommand command = new SqlCommand(queryString, connection);
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();

                    while (reader.Read())
                    {
                        user = new User();

                        if (!String.IsNullOrWhiteSpace(reader["ChaufforID"].ToString()))
                            user.ChaufforID = reader["ChaufforID"].ToString();

                        if (!String.IsNullOrWhiteSpace(reader["Connection"].ToString()))
                            user.Connection = reader["Connection"].ToString();


                    }
                }
                catch (Exception e)
                {
                    string error = e.ToString();
                }
                finally
                {
                }
            }

            // Get Fares if user was found
            if (user != null)
            {
                if (user.DriftStatus < 3)
                {
                    ListFares = GetFares(user, VagtID, dateFares);

                    // Get passengers for fares if any fares were found
                    if (ListFares.Count > 0)
                    {
                        List<Passenger> ListPassengers = GetPassengers(user,VagtID, dateFares);

                         //If passengers were found in that day, add them to each fare
                        if (ListPassengers.Count > 0)
                        {
                            foreach (Fare fare in ListFares)
                            {
                                fare.ListPassengers = new List<Passenger>();

                                foreach (Passenger passenger in ListPassengers)
                                {
                                    if (fare.KoreTurID == passenger.KoreTurID)
                                    {
                                        fare.ListPassengers.Add(passenger);
                                    }

                                }
                            }
                        }
                    }

                    // Check if time on passengers is lower/higher than fare, and adjust fare time to passengers time
                    //ListFares = BeregnTur(ListFares);

                    ListFares = RemoveFaresWithoutPassengers(ListFares);

                    //ListFares = SortPassengerOrder(ListFares);

                    // Serialise List of fares
                    strJSON = js.Serialize(ListFares);
                }
                else
                {
                    // Hvis Cust.DriftStatus < 3 er alt OK  (Cust.DriftStatus = 3 betyder, at systemet er lukket.)
                    strJSON = js.Serialize("System down");
                }
            }
            else
            {
                // Return false if user does not exist
                strJSON = js.Serialize(false);
            }

            return strJSON;
        }

        [WebMethod(EnableSession = true)]
        [ScriptMethod(UseHttpGet = false, ResponseFormat = ResponseFormat.Json)]
        public string getVagtPlan(string username, string password, string company)
        {
            JavaScriptSerializer js = new JavaScriptSerializer();
            string strJSON;

            string connectionString = ConfigurationManager.ConnectionStrings["Conn"].ToString();

            string queryString = "SELECT [User].UserID, [User].UserNavn, [User].LoginTime, [User].ChaufforID, Cust.Connection, Cust.CustNavn, Cust.DriftStatus, Cust.Version";
            queryString += " FROM [User] INNER JOIN Cust ON [User].CustID = Cust.CustID";
            queryString += " WHERE UserNavn = '" + username + "' AND Password = '" + password + "' AND Cust.CustID = '" + company + "';";

            User user = null;

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {

                    SqlCommand command = new SqlCommand(queryString, connection);
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();

                    while (reader.Read())
                    {
                        user = new User();

                        if (!String.IsNullOrWhiteSpace(reader["ChaufforID"].ToString()))
                            user.ChaufforID = reader["ChaufforID"].ToString();

                        if (!String.IsNullOrWhiteSpace(reader["Connection"].ToString()))
                            user.Connection = reader["Connection"].ToString();


                    }
                }
                catch (Exception e)
                {
                    strJSON = js.Serialize(e.ToString());
                }
                finally
                {
                }
            }

            if (user != null)
            {
                // Hent VagtPlan.
                List<Vagt> ListVagt = new List<Vagt>();

                string qStrVogne = "SELECT VagtPlan.VagtID, Vogne.VognID, Vogne.Vogn, VagtPlan.ChaufforID, Chauffor.ChaufforNavn AS Chauffor ";
                qStrVogne += "FROM VagtPlan LEFT OUTER JOIN Chauffor ON VagtPlan.ChaufforID = Chauffor.ChaufforID LEFT OUTER JOIN Vogne ON VagtPlan.VognID = Vogne.VognID ";
              
                using (SqlConnection con = new SqlConnection(user.Connection))
                {
                    try
                    {
                        SqlCommand command = new SqlCommand(qStrVogne, con);
                        con.Open();
                        SqlDataReader reader = command.ExecuteReader();
                        while (reader.Read())
                        {
                            Vagt vagt = new Vagt();
                            if (!String.IsNullOrWhiteSpace(reader["VagtID"].ToString()))
                                vagt.VagtID = int.Parse(reader["VagtID"].ToString());

                            if (!String.IsNullOrWhiteSpace(reader["VognID"].ToString()))
                                vagt.VognID = int.Parse(reader["VognID"].ToString());

                            if (!String.IsNullOrWhiteSpace(reader["Vogn"].ToString()))
                                vagt.VognNavn = reader["Vogn"].ToString().Trim();

                            if (!String.IsNullOrWhiteSpace(reader["ChaufforID"].ToString()))
                                vagt.ChaufforID = int.Parse(reader["ChaufforID"].ToString());

                            if (!String.IsNullOrWhiteSpace(reader["Chauffor"].ToString()))
                                vagt.ChaufforNavn = reader["Chauffor"].ToString().Trim();

                            ListVagt.Add(vagt);

                        }

                        // Serialise ListVogne
                        strJSON = js.Serialize(ListVagt);
                    }
                    catch(Exception e)
                    {
                     strJSON = js.Serialize(e.ToString());
                    }
                finally
                    {
                    }
                }
            }
            else
            {
                //Bruger ikke fundet.
               strJSON= js.Serialize (false);
            }

            return strJSON;
        }

        [WebMethod(EnableSession = true)]
        [ScriptMethod(UseHttpGet = false, ResponseFormat = ResponseFormat.Json)]
        public string checkinVagt(string username, string password, string company, string vagtID)
        {
            JavaScriptSerializer js = new JavaScriptSerializer();
            string strJSON;

            string connectionString = ConfigurationManager.ConnectionStrings["Conn"].ToString();

            string queryString = "SELECT [User].UserID, [User].UserNavn, [User].LoginTime, [User].ChaufforID, Cust.Connection, Cust.CustNavn, Cust.DriftStatus, Cust.Version";
            queryString += " FROM [User] INNER JOIN Cust ON [User].CustID = Cust.CustID";
            queryString += " WHERE UserNavn = '" + username + "' AND Password = '" + password + "' AND Cust.CustID = '" + company + "';";

            User user = null;

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {

                    SqlCommand command = new SqlCommand(queryString, connection);
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();

                    while (reader.Read())
                    {
                        user = new User();

                        if (!String.IsNullOrWhiteSpace(reader["ChaufforID"].ToString()))
                            user.ChaufforID = reader["ChaufforID"].ToString();

                        if (!String.IsNullOrWhiteSpace(reader["Connection"].ToString()))
                            user.Connection = reader["Connection"].ToString();


                    }
                }
                catch (Exception e)
                {
                    strJSON = js.Serialize(e.ToString());
                }
                finally
                {
                }
            }

            if (user != null)
            {
                // Hent nøglerne til vognen.
                string qStrVogne = "UPDATE VagtPlan SET ChaufforID = '" + user.ChaufforID + "' ";
                qStrVogne += "WHERE vagtID= '" + vagtID + "' AND chaufforID IS NULL";


                using (SqlConnection con = new SqlConnection(user.Connection))
                {
                    try
                    {
                        SqlCommand command = new SqlCommand(qStrVogne, con);
                        con.Open();
                       if (command.ExecuteNonQuery() > 0)
                       {
                           strJSON = js.Serialize(true);
                       }
                       else
                       {
                           strJSON = js.Serialize("Vagt ikke låst");
                       }
                    }
                    catch (Exception e)
                    {
                        strJSON = js.Serialize(e.ToString());
                    }
                    finally
                    {
                    }
                }
            }
            else
            {
                //Bruger ikke fundet.
                strJSON = js.Serialize("Bruger ikke fundet");
            }

            return strJSON;
        }

        [WebMethod(EnableSession = true)]
        [ScriptMethod(UseHttpGet = false, ResponseFormat = ResponseFormat.Json)]
        public string checkudVagt(string username, string password, string company, string vagtID)
        {
            JavaScriptSerializer js = new JavaScriptSerializer();
            string strJSON;

            string connectionString = ConfigurationManager.ConnectionStrings["Conn"].ToString();

            string queryString = "SELECT [User].UserID, [User].UserNavn, [User].LoginTime, [User].ChaufforID, Cust.Connection, Cust.CustNavn, Cust.DriftStatus, Cust.Version";
            queryString += " FROM [User] INNER JOIN Cust ON [User].CustID = Cust.CustID";
            queryString += " WHERE UserNavn = '" + username + "' AND Password = '" + password + "' AND Cust.CustID = '" + company + "';";

            User user = null;

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                try
                {

                    SqlCommand command = new SqlCommand(queryString, connection);
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();

                    while (reader.Read())
                    {
                        user = new User();

                        if (!String.IsNullOrWhiteSpace(reader["ChaufforID"].ToString()))
                            user.ChaufforID = reader["ChaufforID"].ToString();

                        if (!String.IsNullOrWhiteSpace(reader["Connection"].ToString()))
                            user.Connection = reader["Connection"].ToString();


                    }
                }
                catch (Exception e)
                {
                    strJSON = js.Serialize(e.ToString());
                }
                finally
                {
                }
            }

            if (user != null)
            {
                // Hent nøglerne til vognen.

                string qStrVogne = "UPDATE VagtPlan SET ChaufforID = NULL ";
                qStrVogne += "WHERE vagtID= '" + vagtID + "' AND chaufforID = '" + user.ChaufforID + "'";


                using (SqlConnection con = new SqlConnection(user.Connection))
                {
                    try
                    {
                        SqlCommand command = new SqlCommand(qStrVogne, con);
                        con.Open();
                        if (command.ExecuteNonQuery() > 0)
                        {
                            strJSON = js.Serialize(true);
                        }
                        else
                        {
                            strJSON = js.Serialize(false);
                        }
                    }
                    catch (Exception e)
                    {
                        strJSON = js.Serialize(e.ToString());
                    }
                    finally
                    {
                    }
                }
            }
            else
            {
                //Bruger ikke fundet.
                strJSON = js.Serialize(false);
            }

            return strJSON;
        }





        //public List<Fare> BeregnTur(List<Fare> ListFares)
        //{
        //    foreach (Fare fare in ListFares)
        //    {

        //        if (fare.ListPassengers.Count > 0)
        //        {
        //            fare.Afgangstid = "23:59";
        //            fare.AnkomstTid = "00:00";


        //            foreach (Passenger passenger in fare.ListPassengers)
        //            {
        //                try
        //                {
        //                    // Check if time on passenger is lower that fares start time, set fare starttime to passengers time
        //                    if (!String.IsNullOrWhiteSpace(passenger.Afgangstid) && !String.IsNullOrWhiteSpace(fare.Afgangstid))
        //                    {
        //                        if (Convert.ToDateTime(passenger.Afgangstid) < Convert.ToDateTime(fare.Afgangstid))
        //                        {
        //                            fare.Afgangstid = passenger.Afgangstid;
        //                            fare.Afgangssted = passenger.Afgangssted;
        //                        }
        //                    }

        //                    if (!String.IsNullOrWhiteSpace(passenger.AnkomstTid) && !String.IsNullOrWhiteSpace(fare.AnkomstTid))
        //                    {
        //                        if (Convert.ToDateTime(passenger.AnkomstTid) > Convert.ToDateTime(fare.AnkomstTid))
        //                        {
        //                            fare.AnkomstTid = passenger.AnkomstTid;
        //                            fare.Ankomststed = passenger.Ankomststed; //
        //                        }

        //                    }
        //                }
        //                catch (Exception ex)
        //                {
        //                    string test = "";
        //                }



        //            }

        //            // Blev der ændret ?
        //            if (fare.Afgangstid == "23:59")
        //            {
        //                fare.Afgangstid = "";
        //            }


        //            if (fare.AnkomstTid == "00:00")
        //            {
        //                fare.AnkomstTid = "Uangivet ankomsttid";
        //            }

        //        }
        //    }

        //    return ListFares;
        //}


        public List<Fare> RemoveFaresWithoutPassengers(List<Fare> ListFares)
        {

            bool passengersFound = false;
            int i = 0;

            for (i = 0; i < ListFares.Count; i++)
            {
                if (ListFares[i].ListPassengers.Count == 0)
                {
                    passengersFound = true;

                    break;
                }
            }

            if (passengersFound)
            {
                ListFares.RemoveAt(i);

                RemoveFaresWithoutPassengers(ListFares);
            }


            return ListFares;
        }


        public List<Fare> GetFares(User user, Decimal VagtID, DateTime date)
        {
            List<Fare> ListFares = new List<Fare>();

            //Den virker !!!!!!!!!!
            //string sqlTure = "SELECT DISTINCT KorePlan.KoreTurID, KorePlan.AfgangTid, KorePlan.AnkomstTid, KorePlan.AfgangSted, KorePlan.AnkomstSted, KorePlan.Bemarkning, KorePlan.Status ";
            //sqlTure += "FROM KorePlanPassager RIGHT OUTER JOIN KorePlan ON KorePlanPassager.KoreTurIdent = KorePlan.KoreTurID ";
            //sqlTure += "WHERE (NOT (KorePlanPassager.PassagerID IN (SELECT MasterPassagerIdent FROM KorePlanPassager AS KorePlanPassager_1 ";
            //sqlTure += "WHERE (Dato = '" + date.ToString("dd-MM-yyyy") + "') AND (NOT (MasterPassagerIdent IS NULL))))) AND (KorePlanPassager.Dato IS NULL) AND (KorePlanPassager.AutoType = " + GetWeekday(date).ToString() + ") ";
            //sqlTure += "AND (KorePlanPassager.KoreUger = 1 OR KorePlanPassager.KoreUger = " + GetWeekNumber(date).ToString() + ") AND (KorePlan.Vagt = " + VagtID.ToString() + ") OR (KorePlanPassager.Dato = '" + date.ToString("dd-MM-yyyy") + "') AND ";
            //sqlTure += "(KorePlan.Vagt = " + VagtID.ToString() + ") OR (KorePlan.Dato = '" + date.ToString("dd-MM-yyyy") + "') AND (KorePlan.Vagt = " + VagtID.ToString() + ") ";
            //sqlTure += "GROUP BY KorePlan.KoreTurID, KorePlan.AfgangTid, KorePlan.AnkomstTid, KorePlan.AfgangSted, KorePlan.AnkomstSted, KorePlan.Bemarkning, KorePlan.Status";


            //Men den her skal prøves
            string sqlTure = " SELECT KoreTurID, TimeStamp, AfgangTid, AnkomstTid, AfgangSted, AnkomstSted, Bemarkning, Status FROM KorePlan ";
            sqlTure += "WHERE (Dato IS NULL) AND (Vagt = " + VagtID.ToString() + ") AND (NOT (KoreTurID IN (SELECT MasterKoreTurIdent FROM KorePlan AS K1 ";
            sqlTure += "WHERE (Dato = @Dato) AND NOT (MasterKoreTurIdent IS NULL)))) AND (AutoType = " + GetWeekday(date).ToString() + ") AND (KoreUger = 1 OR KoreUger = " + GetWeekNumber(date).ToString() + ") ";
            sqlTure += "AND ((SELECT COUNT(*) AS Expr1 FROM KorePlanPassager AS KorePlanPassager_1 WHERE (KoreTurIdent = KorePlan.KoreTurID)) > 0) ";
            sqlTure += "OR  (Dato = @Dato) AND (Vagt = " + VagtID.ToString() + ") ";
            sqlTure += "AND ((SELECT COUNT(*) AS Expr1 FROM KorePlanPassager AS KorePlanPassager_1 WHERE (KoreTurIdent = KorePlan.KoreTurID)) > 0) ";
            sqlTure += "ORDER BY AfgangTid, AnkomstTid";

            using (SqlConnection con = new SqlConnection(user.Connection))
            {
                using (SqlCommand cmd = new SqlCommand(sqlTure, con))
                {           


                    try
                    {
                

                        //cmd.CommandType = CommandType.Text;
                        cmd.Parameters.Add("@Dato", SqlDbType.Date).Value = date;
                        //cmd.Parameters.Add("@LigeUligeUge", SqlDbType.Int).Value = GetWeekNumber(date);
                        //cmd.Parameters.Add("@UgeDag", SqlDbType.Int).Value = GetWeekday(date); // DateTime.Now.DayOfWeek;
                        //cmd.Parameters.Add("@VagtID", SqlDbType.BigInt).Value = VagtID;
                        con.Open();



                        SqlDataReader reader = cmd.ExecuteReader();

                        while (reader.Read())
                        {
                            Fare fare = new Fare();


                            //if (!String.IsNullOrWhiteSpace(reader["VognNummer"].ToString()))
                            //    fare.VognNummer = reader["VognNummer"].ToString().Trim();


                            if (!String.IsNullOrWhiteSpace(reader["KoreTurID"].ToString()))
                                fare.KoreTurID = int.Parse(reader["KoreTurID"].ToString());

                            fare.TimeStamp = BitConverter.ToString((byte[])reader["TimeStamp"]).Replace("-", "");

                            if (!String.IsNullOrWhiteSpace(reader["AfgangTid"].ToString()))
                            {
                                fare.Afgangstid = reader["AfgangTid"].ToString().Trim();
                            }
                            else
                                fare.Afgangstid = " Ingen afgangstid";

                            if (!String.IsNullOrWhiteSpace(reader["AnkomstTid"].ToString()))
                                fare.AnkomstTid = reader["AnkomstTid"].ToString().Trim();


                            if (!String.IsNullOrWhiteSpace(reader["AfgangSted"].ToString()))
                                fare.Afgangssted = reader["AfgangSted"].ToString().Trim();


                            if (!String.IsNullOrWhiteSpace(reader["AnkomstSted"].ToString()))
                                fare.Ankomststed = reader["AnkomstSted"].ToString().Trim();


                            if (!String.IsNullOrWhiteSpace(reader["Bemarkning"].ToString()))
                                fare.Bemarkning = reader["Bemarkning"].ToString().Trim();

                            if (!String.IsNullOrWhiteSpace(reader["Status"].ToString()))
                                fare.Status = int.Parse(reader["Status"].ToString());


                            ListFares.Add(fare);

                        }
                    }
                    catch (Exception e)
                    {
                        string error = e.ToString();

                    }
                    finally
                    {

                    }
                }
            }
            return ListFares;
        }




        public List<Passenger> GetPassengers(User user, Decimal VagtID, DateTime date)
        {
            List<Passenger> ListPassengers = new List<Passenger>();

            string sqlPassager = " SELECT KorePlanPassager.PassagerID, korePlanPassager.TimeStamp, KorePlanPassager.KoreTurIdent, CASE WHEN KundeIdent = 0 THEN CONVERT(nvarchar, AntalPassagerer) + ' passagerer' ELSE kunder.kundenavn END AS Kunde, ";
            sqlPassager += "KorePlanPassager.AfgangTid, KorePlanPassager.AnkomstTid, KorePlanPassager.Afgangsted, KorePlanPassager.AnkomstSted, KorePlanPassager.Bemærkning, ";
            sqlPassager += "KorePlanPassager.Bagage, KorePlanPassager.Status, KorePlanPassager.MasterPassagerIdent, KorePlanPassager.Dato, KorePlanPassager.AutoType, KorePlanPassager.KoreUger ";
            sqlPassager += "FROM Kunder RIGHT OUTER JOIN KorePlanPassager ON Kunder.KundeID = KorePlanPassager.KundeIdent LEFT OUTER JOIN KorePlan ON KorePlanPassager.KoreTurIdent = KorePlan.KoreTurID ";
            sqlPassager += "WHERE (KorePlanPassager.AutoType = " + GetWeekday(date).ToString() + ") AND (KorePlanPassager.KoreUger = 1 OR KorePlanPassager.KoreUger = " + GetWeekNumber(date).ToString() + ") AND (KorePlanPassager.Dato IS NULL) ";
            sqlPassager += "AND (@Dato BETWEEN (SELECT StartDato FROM Kunder AS Kunder_3 WHERE (KundeID = KorePlanPassager.KundeIdent)) AND ";
            sqlPassager += "(SELECT SlutDato FROM Kunder AS Kunder_2 WHERE (KundeID = KorePlanPassager.KundeIdent))) AND (KorePlan.Vagt = " + VagtID.ToString() + ") AND ";
            sqlPassager += "(NOT (KorePlanPassager.PassagerID IN (SELECT MasterPassagerIdent FROM KorePlanPassager AS KorePlanPassager_1 ";
            sqlPassager += "WHERE (Dato = @Dato) AND (NOT (MasterPassagerIdent IS NULL))))) OR (KorePlanPassager.Dato = @Dato) AND (@Dato BETWEEN ";
            sqlPassager += "(SELECT StartDato FROM Kunder AS Kunder_3 WHERE (KundeID = KorePlanPassager.KundeIdent)) AND ";
            sqlPassager += "(SELECT SlutDato FROM Kunder AS Kunder_2 WHERE (KundeID = KorePlanPassager.KundeIdent))) AND (KorePlan.Vagt = " + VagtID.ToString() + ") ";
            sqlPassager += "ORDER BY KorePlanPassager.AfgangTid, KorePlanPassager.AnkomstTid";

            //string sqlPassager = " SELECT KorePlanPassager.PassagerID, KorePlanPassager.KoreTurIdent, CASE WHEN KundeIdent = 0 THEN CONVERT(nvarchar, AntalPassagerer) + ' passagerer' ELSE kunder.kundenavn END AS Kunde, ";
            //sqlPassager += "KorePlanPassager.AfgangTid, KorePlanPassager.AnkomstTid, KorePlanPassager.Afgangsted, KorePlanPassager.AnkomstSted, KorePlanPassager.Bemærkning, ";
            //sqlPassager += "KorePlanPassager.Bagage, KorePlanPassager.Status, KorePlanPassager.MasterPassagerIdent, KorePlanPassager.Dato, KorePlanPassager.AutoType, KorePlanPassager.KoreUger ";
            //sqlPassager += "FROM Kunder RIGHT OUTER JOIN KorePlanPassager ON Kunder.KundeID = KorePlanPassager.KundeIdent LEFT OUTER JOIN KorePlan ON KorePlanPassager.KoreTurIdent = KorePlan.KoreTurID ";
            //sqlPassager += "WHERE (AutoType = " + GetWeekday(date).ToString() + ") AND (KoreUger = 1 OR KoreUger = " + GetWeekNumber(date).ToString() + ") AND ";
            //sqlPassager += "(NOT (PassagerID IN (SELECT MasterPassagerIdent FROM KorePlanPassager AS KorePlanPassager_1 WHERE (Dato = '" + date.ToString("dd-MM-yyyy") + "') AND (NOT (MasterPassagerIdent IS NULL))))) AND (Dato IS NULL) AND ";
            //sqlPassager += "(('" + date.ToString("dd-MM-yyyy") + "') BETWEEN (SELECT StartDato FROM Kunder AS Kunder_3 WHERE (KundeID = KorePlanPassager.KundeIdent)) AND ";
            //sqlPassager += "(SELECT SlutDato FROM Kunder AS Kunder_2 WHERE (KundeID = KorePlanPassager.KundeIdent))) ";
            //sqlPassager += "AND (MasterStartDato IS NULL OR MasterStartDato <= '" + date.ToString("dd-MM-yyyy") + "') OR (Dato = '" + date.ToString("dd-MM-yyyy") + "') AND ";
            //sqlPassager += "(('" + date.ToString("dd-MM-yyyy") + "') BETWEEN (SELECT StartDato FROM Kunder AS Kunder_3 WHERE (KundeID = KorePlanPassager.KundeIdent)) AND ";
            //sqlPassager += "(SELECT SlutDato FROM Kunder AS Kunder_2 WHERE KundeID = KorePlanPassager.KundeIdent)))  OR ";
            //sqlPassager += "(Dato = '" + date.ToString("dd-MM-yyyy") + "') AND (KundeIdent = 0)) AND (KorePlan.Vagt = " + VagtID.ToString() + ") ";
            //sqlPassager += "ORDER BY KorePlanPassager.AfgangTid, KorePlanPassager.AnkomstTid";



            using (SqlConnection con = new SqlConnection(user.Connection))
            {
                using (SqlCommand cmd = new SqlCommand(sqlPassager, con))
                {             

                    try
                    {

                        //cmd.CommandType = CommandType.StoredProcedure;
                        //cmd.Parameters.Add("@ChaufforID", SqlDbType.Int).Value = int.Parse(user.ChaufforID);
                        cmd.Parameters.Add("@Dato", SqlDbType.Date).Value = date;
                        //cmd.Parameters.Add("@UgeDag", SqlDbType.Int).Value = GetWeekday(date); // DateTime.Now.DayOfWeek;
                        //cmd.Parameters.Add("@LigeUligeUge", SqlDbType.Int).Value = GetWeekNumber(date);

                        con.Open();

                        SqlDataReader reader = cmd.ExecuteReader();

                        while (reader.Read())
                        {
                            Passenger passenger = new Passenger();

                            if (!String.IsNullOrWhiteSpace(reader["PassagerID"].ToString()))
                                passenger.PassagerID = int.Parse(reader["PassagerID"].ToString());

                            passenger.TimeStamp = BitConverter.ToString((byte[])reader["TimeStamp"]).Replace("-", "");


                            if (!String.IsNullOrWhiteSpace(reader["KoreTurIdent"].ToString()))
                                passenger.KoreTurID = int.Parse(reader["KoreTurIdent"].ToString());


                            if (!String.IsNullOrWhiteSpace(reader["Kunde"].ToString()))
                                passenger.Kunde = reader["Kunde"].ToString().Trim();


                            if (!String.IsNullOrWhiteSpace(reader["Bagage"].ToString()))
                                passenger.Bagage = reader["Bagage"].ToString().Trim();


                            if (!String.IsNullOrWhiteSpace(reader["Bemærkning"].ToString()))
                                passenger.Bemarkning = reader["Bemærkning"].ToString().Trim();


                            if (!String.IsNullOrWhiteSpace(reader["Status"].ToString()))
                                passenger.Status = int.Parse(reader["Status"].ToString());


                            if (!String.IsNullOrWhiteSpace(reader["AfgangTid"].ToString()))
                                passenger.Afgangstid = reader["AfgangTid"].ToString().Trim();
                            else
                                passenger.Afgangstid = " Ingen afgangstid";


                            if (!String.IsNullOrWhiteSpace(reader["AnkomstTid"].ToString()))
                                passenger.AnkomstTid = reader["AnkomstTid"].ToString().Trim();


                            if (!String.IsNullOrWhiteSpace(reader["AfgangSted"].ToString()))
                                passenger.Afgangssted = reader["AfgangSted"].ToString().Trim();

                            if (!String.IsNullOrWhiteSpace(reader["AnkomstSted"].ToString()))
                                passenger.Ankomststed = reader["AnkomstSted"].ToString().Trim();

                            ListPassengers.Add(passenger);

                        }
                    }
                    catch (Exception e)
                    {
                        string error = e.ToString();

                    }
                    finally
                    {

                    }

                }
            }


            // Sort list by afgangstidspunkt
            //ListPassengers.Sort((x, y) => string.Compare(x.Afgangstid, y.Afgangstid));



            return ListPassengers;
        }


        public int GetWeekday(DateTime date)
        {
            string[] weekdaysArray = new string[8] { "*manual*", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" };

            int weekDay = 0;

            for (int i = 0; i < weekdaysArray.Length; i++)
            {
                if (weekdaysArray[i] == date.DayOfWeek.ToString().ToLower())
                {
                    weekDay = i;
                    break;
                }
            }

            return weekDay;
        }


        public int GetWeekNumber(DateTime date)
        {
            int uge = 1;

            if ((System.Globalization.DateTimeFormatInfo.CurrentInfo.Calendar.GetWeekOfYear(date, System.Globalization.DateTimeFormatInfo.CurrentInfo.CalendarWeekRule, System.Globalization.DateTimeFormatInfo.CurrentInfo.FirstDayOfWeek) % 2) == 0)
                uge = 2;
            else
                uge = 3;

            return uge;
        }


        //public List<Fare> SortPassengerOrder(List<Fare> ListFares)
        //{

        //    foreach (Fare fare in ListFares)
        //    {
        //        var newList = fare.ListPassengers.OrderBy(x => x.Afgangstid)
        //           .ThenBy(x => x.AnkomstTid)
        //           .ToList();

        //        fare.ListPassengers = newList;

        //        // Set start place
        //        if (fare.ListPassengers.Count > 0)
        //        {
        //            fare.Afgangssted = fare.ListPassengers[0].Afgangssted;
        //            fare.Ankomststed = fare.ListPassengers[fare.ListPassengers.Count - 1].Ankomststed;
        //        }
        //    }

        //    return ListFares;
        //}

    }
}
