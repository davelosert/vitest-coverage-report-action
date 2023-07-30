import { describe, expect, it, vi } from "vitest";
import path from "path";
import * as core from "@actions/core"
import { getViteConfigPath } from "./getViteConfigPath";

describe("getViteConfigPath", () => {
  const mockWorkingDirectory = path.resolve(
    __dirname,
    "..",
    "test",
    "mockConfig"
  );

  it("resolves with a full path if a file at the provided path exists", async (): Promise<void> => {
    await expect(
      getViteConfigPath(mockWorkingDirectory, "vitest.config.all.js")
    ).resolves.toMatch('test/mockConfig/vitest.config.all.js');
  });

  it("resolves with a full path if no path is provided but a file with a default name exists", async (): Promise<void> => {
    await expect(getViteConfigPath(mockWorkingDirectory, "")).resolves.toMatch(
      'test/mockConfig/vitest.config.js'
    );
  });

  it("returns null if config file can not be found", async (): Promise<void> => {
    vi.spyOn(core, 'warning').mockImplementationOnce(() => { })
    await expect(
      getViteConfigPath(mockWorkingDirectory, "doesNotExist")
    ).resolves.toBeNull();
  });
});
