import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SyncStatusIndicator } from "../SyncStatusIndicator";

vi.mock("../../lib/offline/useSync", () => ({
  useSync: vi.fn(),
}));

vi.mock("../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

import { useSync } from "../../lib/offline/useSync";
import { fireEvent } from "@testing-library/react";

function mockSync(status: "idle" | "syncing" | "offline" | "error", pending = 0) {
  vi.mocked(useSync).mockReturnValue({
    status,
    pending,
    lastSyncAt: null,
    sync: vi.fn().mockResolvedValue(undefined),
    refreshPending: vi.fn(),
  } as never);
}

describe("SyncStatusIndicator", () => {
  beforeEach(() => {
    vi.mocked(useSync).mockReset();
  });

  it("показывает label 'Synced' в idle", () => {
    mockSync("idle");
    render(<SyncStatusIndicator />);
    expect(screen.getByLabelText("Synced")).toBeInTheDocument();
  });

  it("показывает label 'Syncing...' в syncing", () => {
    mockSync("syncing");
    render(<SyncStatusIndicator />);
    expect(screen.getByLabelText("Syncing...")).toBeInTheDocument();
  });

  it("показывает офлайн-метку и бейдж количества в очереди", () => {
    mockSync("offline", 3);
    render(<SyncStatusIndicator />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toContain("Offline");
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("вызывает sync по клику", () => {
    mockSync("offline", 1);
    render(<SyncStatusIndicator />);
    fireEvent.click(screen.getByRole("button"));
    expect(vi.mocked(useSync).mock.results[0].value.sync).toHaveBeenCalled();
  });
});
