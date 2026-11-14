"use client";

import { PageTitle } from "@/components/dashboard/widgets";
import { MessagesView } from "@/components/domain/MessagesView";

export default function StudentMessagesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Messages"
        subtitle="Send thank-you notes to your sponsors and continue conversations."
      />
      <MessagesView perspective="student" />
    </div>
  );
}
