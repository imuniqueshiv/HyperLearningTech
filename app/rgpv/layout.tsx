import { Breadcrumbs } from "@/components/breadcrumbs";

export default function RGPVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Breadcrumbs />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
