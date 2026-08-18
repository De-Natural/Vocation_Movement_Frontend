"use client";

import { PageTitle } from "@/components/dashboard/widgets";
import { MessagesView } from "@/components/domain/MessagesView";
import { messages } from "@/lib/mock-data";

export default function SponsorMessagesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Messages"
        subtitle="Thank-you notes and updates from the students you support."
      />
      <MessagesView initialMessages={messages} perspective="sponsor" />
    </div>
  );
}
