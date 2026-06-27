import { Breadcrumbs } from "@/components/breadcrumbs";

export default function RGPVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumbs />
      {children}
    </>
  );
}
