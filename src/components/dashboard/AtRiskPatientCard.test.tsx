import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AtRiskPatientCard } from "./AtRiskPatientCard";
import type { AtRiskPatient } from "@/hooks/useAtRiskPatients";

describe("AtRiskPatientCard", () => {
  it("renders a patient who hasn't attended sessions for a long time", () => {
    const mockPatient: AtRiskPatient = {
      id: "test-patient-123",
      first_name: "Mario",
      last_name: "Rossi",
      days_since_last: 60, // Long time (High risk since > 45)
      total_appointments: 10,
      last_appointment_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      last_contacted_at: null,
      suggested_message: "Ciao Mario, ti scrivo per sapere come stai. Se ti va, possiamo riprendere le nostre sedute — sono qui per te.",
    };

    const handleMarkContacted = vi.fn();

    render(
      <AtRiskPatientCard
        patient={mockPatient}
        onMarkContacted={handleMarkContacted}
      />
    );

    // Verify patient name
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();

    // Verify the days since last session is displayed
    expect(screen.getByText("60 giorni fa")).toBeInTheDocument();

    // Verify the suggested message is available in the component
    expect(screen.getByText(/Ciao Mario, ti scrivo per sapere come stai/)).toBeInTheDocument();
  });
});
