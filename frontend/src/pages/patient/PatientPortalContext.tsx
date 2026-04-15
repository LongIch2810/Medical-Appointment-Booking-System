import React, { useMemo, useState } from "react";

import {
  MOCK_APPOINTMENTS,
  MOCK_CONVERSATIONS,
  MOCK_DEPENDENTS,
  MOCK_HEALTH_RECORD,
  MOCK_HEALTH_RECORDS_BY_PROFILE_ID,
  MOCK_MESSAGES,
  MOCK_PROFILE,
  MOCK_SETTINGS,
  MOCK_VISIT_RESULTS,
} from "@/pages/patient/patientMockData";
import type {
  ConsultationMessage,
  HealthProfileId,
  HealthProfileTarget,
  PatientRelatives,
  PatientProfile,
} from "@/pages/patient/patientTypes";
import { getRelativeHealthProfileId } from "@/pages/patient/patientTypes";
import {
  PatientPortalContext,
  type PatientPortalContextValue,
} from "@/pages/patient/PatientPortalContextObject";

const getNextDependentId = (dependents: PatientRelatives[]) => {
  if (dependents.length === 0) {
    return 1;
  }
  return Math.max(...dependents.map((dependent) => dependent.id)) + 1;
};

const getNextMessageId = (messages: ConsultationMessage[]) => {
  if (messages.length === 0) {
    return 1;
  }
  return Math.max(...messages.map((message) => message.id)) + 1;
};

interface PatientPortalProviderProps {
  children: React.ReactNode;
}

export const PatientPortalProvider: React.FC<PatientPortalProviderProps> = ({
  children,
}) => {
  const [profile, setProfile] = useState<PatientProfile>(MOCK_PROFILE);
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);
  const [dependents, setDependents] = useState(MOCK_DEPENDENTS);
  const [settings, setSettings] = useState(MOCK_SETTINGS);
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [selectedConversationId, setSelectedConversationId] = useState(
    MOCK_CONVERSATIONS[0]?.id ?? 0,
  );
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [healthRecordsByProfileId, setHealthRecordsByProfileId] = useState(
    MOCK_HEALTH_RECORDS_BY_PROFILE_ID,
  );
  const [selectedHealthProfileId, setSelectedHealthProfileId] =
    useState<HealthProfileId>("owner");

  const healthProfileTargets = useMemo<HealthProfileTarget[]>(
    () => [
      {
        id: "owner",
        displayName: profile.fullName,
        relationship: "Chủ tài khoản",
      },
      ...dependents.map((relative) => ({
        id: getRelativeHealthProfileId(relative.id),
        displayName: relative.fullName,
        relationship: relative.relationship,
      })),
    ],
    [dependents, profile.fullName],
  );

  const selectedHealthRecord =
    healthRecordsByProfileId[selectedHealthProfileId] ?? null;

  const value = useMemo<PatientPortalContextValue>(
    () => ({
      profile,
      updateProfile: (nextProfile) => {
        setProfile(nextProfile);
      },
      appointments,
      cancelAppointment: (appointmentId) => {
        setAppointments((prev) =>
          prev.map((appointment) =>
            appointment.id === appointmentId
              ? { ...appointment, status: "cancelled" }
              : appointment,
          ),
        );
      },
      dependents,
      saveDependent: (dependent) => {
        setDependents((prev) => {
          if (dependent.id) {
            return prev.map((item) =>
              item.id === dependent.id ? { ...item, ...dependent } : item,
            );
          }
          return [
            ...prev,
            {
              ...dependent,
              id: getNextDependentId(prev),
            },
          ];
        });
      },
      removeDependent: (dependentId) => {
        const removedProfileId = getRelativeHealthProfileId(dependentId);
        setDependents((prev) =>
          prev.filter((dependent) => dependent.id !== dependentId),
        );
        setHealthRecordsByProfileId((prev) => {
          const next = { ...prev };
          delete next[removedProfileId];
          return next;
        });
        setSelectedHealthProfileId((prev) =>
          prev === removedProfileId ? "owner" : prev,
        );
      },
      settings,
      updateSetting: (key, value) => {
        setSettings((prev) => ({
          ...prev,
          [key]: value,
        }));
      },
      conversations,
      selectedConversationId,
      selectConversation: (conversationId) => {
        setSelectedConversationId(conversationId);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, unread: 0 }
              : conversation,
          ),
        );
      },
      messages,
      sendMessage: (content) => {
        const normalizedContent = content.trim();
        if (!normalizedContent || !selectedConversationId) {
          return;
        }

        const nextMessage: ConsultationMessage = {
          id: getNextMessageId(messages),
          conversationId: selectedConversationId,
          sender: "patient",
          content: normalizedContent,
          sentAt: "Vừa xong",
        };

        setMessages((prev) => [...prev, nextMessage]);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === selectedConversationId
              ? {
                  ...conversation,
                  lastMessage: normalizedContent,
                  lastTime: "Vừa xong",
                  unread: 0,
                }
              : conversation,
          ),
        );
      },
      healthRecord: healthRecordsByProfileId.owner ?? MOCK_HEALTH_RECORD,
      healthProfileTargets,
      selectedHealthProfileId,
      selectHealthProfile: (profileId) => {
        setSelectedHealthProfileId(profileId);
      },
      healthRecordsByProfileId,
      selectedHealthRecord,
      visitResults: MOCK_VISIT_RESULTS,
    }),
    [
      appointments,
      conversations,
      dependents,
      healthProfileTargets,
      healthRecordsByProfileId,
      messages,
      profile,
      selectedConversationId,
      selectedHealthProfileId,
      selectedHealthRecord,
      settings,
    ],
  );

  return (
    <PatientPortalContext.Provider value={value}>
      {children}
    </PatientPortalContext.Provider>
  );
};
