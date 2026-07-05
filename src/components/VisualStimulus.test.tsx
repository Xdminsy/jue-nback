import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VisualStimulus } from "./VisualStimulus";
import type { TrialStimulus } from "../types";

const colorTrial: TrialStimulus = {
  trialIndex: 0,
  values: { "visual-color": "teal" },
  expectedMatches: { "visual-color": false }
};

const positionTrial: TrialStimulus = {
  trialIndex: 0,
  values: { position: 4 },
  expectedMatches: { position: false }
};

describe("VisualStimulus", () => {
  it("does not render the position grid for non-position visual modes", () => {
    const { container } = render(
      <VisualStimulus active channels={["visual-color", "audio-letter"]} trial={colorTrial} />
    );

    expect(container.querySelector(".stimulus-grid")).not.toBeInTheDocument();
    expect(container.querySelector(".color-token")).toBeInTheDocument();
  });

  it("keeps the position grid when the position channel is active", () => {
    const { container } = render(<VisualStimulus active channels={["position", "audio-tone"]} trial={positionTrial} />);

    expect(container.querySelector(".stimulus-grid")).toBeInTheDocument();
    expect(container.querySelectorAll(".grid-cell")).toHaveLength(9);
  });

  it("renders a neutral timing cue for audio-only modes", () => {
    const { container } = render(<VisualStimulus active channels={["audio-tone"]} trial={null} />);

    expect(container.querySelector(".audio-pulse")).toBeInTheDocument();
  });
});
