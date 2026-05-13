import { getSettings } from "./actions";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">ตั้งค่าระบบ</h2>

      <div className="max-w-xl rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-700">ข้อมูลลายเซ็น (ใช้ใน Export Word)</h3>
        <SettingsForm
          initialDeanName={settings["dean_name"] ?? "ผู้ช่วยศาสตราจารย์ ดร.กฤษ  สุจริตตั้งธรรม"}
          initialDeanTitle={settings["dean_title"] ?? "คณบดีคณะวิทยาศาสตร์และเทคโนโลยี"}
        />
      </div>
    </div>
  );
}
