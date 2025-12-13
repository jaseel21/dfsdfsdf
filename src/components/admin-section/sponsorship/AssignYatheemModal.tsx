"use client";

import React, { useState, useEffect } from "react";
import { X, Search, UserPlus } from "lucide-react";

interface Yatheem {
  _id: string;
  name: string;
  phone: string;
  place: string;
  class: string;
  school: string;
  sponsorId: string | null;
}

interface AssignYatheemModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsorId: string;
  sponsorName: string;
  onAssign: (yatheemId: string) => void;
}

export default function AssignYatheemModal({
  isOpen,
  onClose,
  sponsorId,
  sponsorName,
  onAssign,
}: AssignYatheemModalProps) {
  const [yatheem, setYatheem] = useState<Yatheem[]>([]);
  const [filteredYatheem, setFilteredYatheem] = useState<Yatheem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchYatheem();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchText) {
      const filtered = yatheem.filter(
        (y) =>
          y.name.toLowerCase().includes(searchText.toLowerCase()) ||
          y.phone.includes(searchText) ||
          y.place.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredYatheem(filtered);
    } else {
      setFilteredYatheem(yatheem);
    }
  }, [searchText, yatheem]);

  const fetchYatheem = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/yatheem", {
        headers: {
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch yatheem");
      const data = await response.json();
      setYatheem(data);
      setFilteredYatheem(data);
    } catch (error) {
      console.error("Error fetching yatheem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async (yatheemId: string) => {
    try {
      const response = await fetch("/api/yatheem/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "9a4f2c8d7e1b5f3a9c2d8e7f1b4a5c3d",
        },
        body: JSON.stringify({ yatheemId, sponsorId }),
      });
      if (!response.ok) throw new Error("Failed to assign yatheem");
      onAssign(yatheemId);
      onClose();
    } catch (error) {
      console.error("Error assigning yatheem:", error);
      alert("Failed to assign yatheem");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Assign Yatheem to Sponsor</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {sponsorName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search yatheem..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : filteredYatheem.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No yatheem found</div>
          ) : (
            <div className="space-y-2">
              {filteredYatheem.map((y) => (
                <div
                  key={y._id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-semibold">{y.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {y.place} • Class: {y.class} • {y.school}
                    </p>
                    {y.sponsorId && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Already assigned to another sponsor
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAssign(y._id)}
                    disabled={!!y.sponsorId}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

