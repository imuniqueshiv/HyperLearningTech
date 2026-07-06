"use client";

import dynamic from "next/dynamic";
import WorkspaceChatSkeleton from "@/components/ai/workspace-chat-skeleton";
import type { WorkspaceChatProps } from "@/components/ai/workspace-chat";

const WorkspaceChat = dynamic(() => import("@/components/ai/workspace-chat"), {
  ssr: false,
  loading: () => <WorkspaceChatSkeleton />,
});

export default function WorkspaceChatLoader(props: WorkspaceChatProps) {
  return <WorkspaceChat {...props} />;
}
