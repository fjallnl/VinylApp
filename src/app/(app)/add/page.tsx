import RecordForm from "@/components/RecordForm";
import DesktopUserMenu from "@/components/DesktopUserMenu";

export default function AddPage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Add Record</h1>
        <div className="hidden md:block">
          <DesktopUserMenu />
        </div>
      </div>
      <RecordForm />
    </div>
  );
}
