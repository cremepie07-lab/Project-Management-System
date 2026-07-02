import PomodoroMiniTimer from "@/components/board/PomodoroMiniTimer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PomodoroMiniTimer />
    </>
  );
}
