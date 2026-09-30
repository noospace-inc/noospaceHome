import LegalPage from "../components/legal-page";

export default function CookiesPage() {
  return <LegalPage title="Cookie policy" intro="This page describes how cookies and similar browser storage may be used on the Noo Space website." sections={[
    { title: "What cookies do", body: "Cookies are small files stored by your browser. Similar technologies can remember settings, support core site features, or help understand how a website is used." },
    { title: "How this site uses them", body: "The website may use strictly necessary storage for core functionality. If analytics, advertising, or other optional tools are added, this policy and any required consent controls should be updated to identify them." },
    { title: "Managing cookies", body: "You can manage or remove cookies through your browser settings. Blocking essential cookies may affect how parts of the site work." },
  ]} />;
}
