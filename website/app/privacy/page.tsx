import LegalPage from "../components/legal-page";

export default function PrivacyPage() {
  return <LegalPage title="Privacy policy" intro="This policy explains how Noo Space may handle personal information when you browse this website or contact us. Please review it before submitting information through the site." sections={[
    { title: "Information you provide", body: "When you use the contact form, you provide your name, the service you are interested in, and your message. Please do not include sensitive personal information." },
    { title: "How information is used", body: "Information may be used to respond to inquiries, understand project requirements, provide requested services, maintain site security, and meet legal obligations." },
    { title: "Sharing and retention", body: "Information may be shared with service providers who help operate the website or deliver a project, subject to appropriate safeguards. We retain it only as long as needed for these purposes or as required by law." },
    { title: "Cookies and security", body: "The site may use essential storage or cookies to operate. See the cookie policy for details. We use reasonable safeguards, though no online transmission or storage can be guaranteed completely secure." },
    { title: "Your choices", body: "Depending on your location, you may have rights to access, correct, delete, or restrict the use of your personal information. Contact Noo Space through the contact section of this site to make a request." },
    { title: "Changes", body: "We may revise this policy as our practices or legal requirements change. The latest version will be published on this page." },
  ]} />;
}
