import LegalPage from "../components/legal-page";

export default function CancellationPage() {
  return <LegalPage title="Cancellation policy" intro="Project schedules and cancellation arrangements are confirmed in writing for each engagement. This page provides general guidance and does not replace a signed project agreement." sections={[
    { title: "Before work begins", body: "A project may be cancelled before its agreed start date by written notice. Any non-refundable third-party costs already approved for the project may remain payable." },
    { title: "After work begins", body: "If a project is cancelled after work has started, the client is responsible for fees for work completed and approved expenses incurred up to the cancellation date, subject to the project agreement and applicable law." },
    { title: "Pausing or rescheduling", body: "Tell us as early as possible if you need to pause or reschedule. A pause may affect availability, delivery dates, and costs where work must be restarted or third-party services are affected." },
    { title: "How to request a change", body: "Send a written cancellation, pause, or rescheduling request through the contact section of this website. The project agreement governs if its cancellation terms differ from this general policy." },
  ]} />;
}
