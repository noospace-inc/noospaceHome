import LegalPage from "../components/legal-page";

export default function TermsPage() {
  return <LegalPage title="Terms and conditions" intro="These terms describe the general conditions for using the Noo Space website and discussing or purchasing our services. A project proposal or signed agreement may set additional terms for that engagement." sections={[
    { title: "Using this website", body: "You may browse this website for lawful purposes. Do not interfere with its operation, attempt unauthorized access, or use its content in a way that violates another person’s rights." },
    { title: "Services and proposals", body: "Service scope, deliverables, fees, milestones, revisions, and acceptance criteria are agreed in writing for each project before work begins. Information on this website is general and is not a binding quote." },
    { title: "Payments and expenses", body: "Payment amounts, due dates, taxes, and any approved third-party expenses will be stated in the applicable proposal or agreement. Work may be paused when an agreed payment is overdue." },
    { title: "Changes and cancellation", body: "Requests that change an agreed scope may affect timing and fees. Either party may end an engagement according to its written agreement; see our cancellation policy for general guidance." },
    { title: "Intellectual property", body: "Each project agreement will state who owns the final deliverables and when ownership transfers. Noo Space retains rights to its pre-existing tools, methods, and materials. Third-party assets remain subject to their own licenses." },
    { title: "Disclaimer and liability", body: "This website is provided as available. To the extent permitted by applicable law, Noo Space excludes implied warranties for the website and is not liable for indirect or consequential losses. Nothing here limits liability that cannot legally be limited." },
    { title: "Updates and governing law", body: "We may update these terms by publishing a revised version here. Applicable law and dispute resolution should be specified in the project agreement or, where none exists, determined by the laws applicable to the parties and transaction." },
  ]} />;
}
