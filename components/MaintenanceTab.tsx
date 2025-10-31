import { useState } from "react";
import { Calendar, Plus } from "lucide-react";

interface MaintenanceTabProps {
  grounds: any[];
  selectedGround: string;
  maintenanceGround: string;
  setMaintenanceGround: (ground: string) => void;
  showMaintenanceForm: boolean;
  setShowMaintenanceForm: (show: boolean) => void;
  maintenanceDate: string;
  setMaintenanceDate: (date: string) => void;
  selectedMaintenanceSlots: string[];
  setSelectedMaintenanceSlots: (slots: string[]) => void;
  maintenanceTimeSlots: string[];
  toggleMaintenanceSlot: (slot: string) => void;
  savingMaintenance: boolean;
  saveMaintenance: () => Promise<void>;
  editingDate: string | null;
  setEditingDate: (date: string | null) => void;
  handleEditMaintenance: (date: string, slots: string[]) => void;
  handleFinishMaintenance: (date: string) => void;
  handleFinishMaintenanceForGround?: (date: string, groundName: string) => void;
  getBlockedForSelectedGround: () => Record<string, string[]>;
}

const MaintenanceTab = ({
  grounds,
  selectedGround,
  maintenanceGround,
  setMaintenanceGround,
  showMaintenanceForm,
  setShowMaintenanceForm,
  maintenanceDate,
  setMaintenanceDate,
  selectedMaintenanceSlots,
  setSelectedMaintenanceSlots,
  maintenanceTimeSlots,
  toggleMaintenanceSlot,
  savingMaintenance,
  saveMaintenance,
  editingDate,
  setEditingDate,
  handleEditMaintenance,
  handleFinishMaintenance,
  handleFinishMaintenanceForGround,
  getBlockedForSelectedGround,
}: MaintenanceTabProps) => {
  return (
    <div>
      {/* Ground selector at top level */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Ground
        </label>
        <select
          value={maintenanceGround}
          onChange={(e) => setMaintenanceGround(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {selectedGround && selectedGround !== "all" ? (
            grounds
              .filter((g) => g.name === selectedGround)
              .map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))
          ) : (
            <>
              <option value="">-- Select a ground --</option>
              {grounds.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Show maintenance list first */}
      {(() => {
        // If no ground selected, show aggregated maintenance across all grounds
        if (!maintenanceGround) {
          // collect all blocked entries from every ground
          const allEntries: {
            date: string;
            groundName: string;
            slots: string[];
          }[] = [];
          grounds.forEach((g: any) => {
            const blocked = (g as any).blockedSlots || {};
            Object.keys(blocked).forEach((date) => {
              allEntries.push({
                date,
                groundName: g.name,
                slots: blocked[date],
              });
            });
          });

          if (allEntries.length === 0) {
            return (
              <div className="text-sm text-gray-500 text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>
                  No ongoing maintenance. Select a ground to manage schedules.
                </p>
              </div>
            );
          }

          // sort by date asc
          allEntries.sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          const convert24To12 = (timeStr: string) => {
            const [hours] = timeStr.split(":");
            const hoursNum = parseInt(hours, 10);
            const meridiem = hoursNum >= 12 ? "PM" : "AM";
            const displayHours =
              hoursNum > 12 ? hoursNum - 12 : hoursNum === 0 ? 12 : hoursNum;
            return `${String(displayHours).padStart(2, "0")}:00 ${meridiem}`;
          };

          return (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Ongoing Maintenance
                  </h3>
                </div>

                <div className="space-y-3">
                  {allEntries.map((entry) => (
                    <div
                      key={`${entry.groundName}-${entry.date}`}
                      className="p-3 border rounded-lg flex items-start justify-between hover:shadow-sm transition-shadow"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(entry.date).toLocaleDateString("en-LK")} •{" "}
                          {entry.groundName}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {entry.slots.map((slot) => (
                            <span
                              key={slot}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded"
                            >
                              {convert24To12(slot)}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => {
                            // set the ground and open edit for that date
                            setMaintenanceGround(entry.groundName);
                            handleEditMaintenance(entry.date, entry.slots);
                          }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (handleFinishMaintenanceForGround) {
                              handleFinishMaintenanceForGround(
                                entry.date,
                                entry.groundName
                              );
                            } else {
                              // fallback to the single-ground handler (requires selecting the ground first)
                              setMaintenanceGround(entry.groundName);
                              handleFinishMaintenance(entry.date);
                            }
                          }}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Finish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        }

        const blocked = getBlockedForSelectedGround();
        const dates = Object.keys(blocked).sort();

        return (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Maintenance Schedule
                </h3>
                <button
                  onClick={() => setShowMaintenanceForm(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Maintenance
                </button>
              </div>

              {dates.length === 0 ? null : (
                // <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                //   <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                //   <p className="text-sm text-gray-600">
                //     No maintenance scheduled.
                //   </p>
                //   <button
                //     onClick={() => setShowMaintenanceForm(true)}
                //     className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                //   >
                //     Schedule Maintenance
                //   </button>
                // </div>
                <div className="space-y-3">
                  {dates.map((date) => (
                    <div
                      key={date}
                      className="p-3 border rounded-lg flex items-start justify-between hover:shadow-sm transition-shadow"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(date).toLocaleDateString("en-LK")}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {blocked[date].map((slot) => (
                            <span
                              key={slot}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded"
                            >
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() =>
                            handleEditMaintenance(date, blocked[date])
                          }
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleFinishMaintenance(date)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Finish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maintenance form */}
            {showMaintenanceForm && (
              <div className="space-y-4 border-t pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    {editingDate ? "Edit Maintenance" : "Schedule Maintenance"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowMaintenanceForm(false);
                      setEditingDate(null);
                      setSelectedMaintenanceSlots([]);
                      setMaintenanceDate(
                        new Date().toISOString().split("T")[0]
                      );
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={maintenanceDate}
                    onChange={(e) => setMaintenanceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slots
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-auto pr-2">
                    {maintenanceTimeSlots.map((slot) => (
                      <label
                        key={slot}
                        className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMaintenanceSlots.includes(slot)}
                          onChange={() => toggleMaintenanceSlot(slot)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{slot}</span>
                      </label>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Selected: {selectedMaintenanceSlots.length}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveMaintenance}
                    disabled={savingMaintenance}
                    className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
                      savingMaintenance ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {savingMaintenance ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setShowMaintenanceForm(false);
                      setEditingDate(null);
                      setSelectedMaintenanceSlots([]);
                      setMaintenanceDate(
                        new Date().toISOString().split("T")[0]
                      );
                    }}
                    className="px-4 py-2 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
};

export default MaintenanceTab;
