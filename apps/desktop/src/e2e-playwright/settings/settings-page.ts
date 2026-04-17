/**
 * Settings Page Object Model
 *
 * Represents the Settings page of the Social-Pip application.
 * Provides methods for viewing settings, toggling options, and saving changes.
 *
 * @example
 * const settingsPage = new SettingsPage(page)
 * await settingsPage.goto()
 * await settingsPage.toggleSetting('notifications', true)
 */
import type { Locator, Page } from "@playwright/test";
import { BasePage } from "../base-page";

/**
 * Page Object Model for the Settings page
 *
 * Extends BasePage and provides:
 * - Navigation to Settings
 * - Setting toggles and inputs
 * - Save/apply changes
 * - Section navigation
 */
export class SettingsPage extends BasePage {
  /** The main heading (h1) of the settings page */
  readonly heading: Locator;

  /** Save changes button */
  readonly saveButton: Locator;

  /** Reset to defaults button */
  readonly resetButton: Locator;

  /** Settings sections container */
  readonly settingsSections: Locator;

  /** General settings section */
  readonly generalSection: Locator;

  /** Notification settings section */
  readonly notificationsSection: Locator;

  /** Privacy settings section */
  readonly privacySection: Locator;

  /** Account settings section */
  readonly accountSection: Locator;

  /**
   * Creates a new SettingsPage instance
   * @param page - Playwright page instance
   */
  constructor(page: Page) {
    super(page, "page-settings");

    // Use getByRole for heading
    this.heading = page.getByRole("heading", { level: 1 });

    // Use getByRole for action buttons
    this.saveButton = page.getByRole("button", { name: "Save" });
    this.resetButton = page.getByRole("button", { name: "Reset" });

    // Use getByRole for settings navigation/sections (tabpanel or region)
    this.settingsSections = page.getByRole("region").filter({ hasText: "Settings" });

    // Use getByRole for sections with heading landmarks
    this.generalSection = page.getByRole("region", { name: "General" });
    this.notificationsSection = page.getByRole("region", { name: "Notifications" });
    this.privacySection = page.getByRole("region", { name: "Privacy" });
    this.accountSection = page.getByRole("region", { name: "Account" });
  }

  /**
   * Navigate to the Settings page from anywhere in the app
   *
   * Clicks the Settings link in the navigation sidebar.
   */
  protected async navigateHere(): Promise<void> {
    await this.getNavLink("Settings").click();
  }

  /**
   * Verify the settings page is fully loaded
   *
   * Checks that:
   * - Page container is visible
   * - Main heading is visible
   * - Settings sections are visible
   *
   * @returns this for method chaining
   */
  override async verifyPageLoaded(): Promise<this> {
    await super.verifyPageLoaded();
    await this.heading.waitFor({ state: "visible" });
    return this;
  }

  /**
   * Get a toggle switch by its label
   *
   * Uses getByRole for switch elements (accessibility-first).
   *
   * @param label - The label of the toggle setting
   * @returns Locator for the switch element
   */
  getToggle(label: string): Locator {
    return this.page.getByRole("switch", { name: label });
  }

  /**
   * Get a checkbox setting by its label
   *
   * @param label - The label of the checkbox
   * @returns Locator for the checkbox
   */
  getCheckbox(label: string): Locator {
    return this.page.getByRole("checkbox", { name: label });
  }

  /**
   * Get a radio button by its label
   *
   * @param label - The label of the radio button
   * @returns Locator for the radio button
   */
  getRadioButton(label: string): Locator {
    return this.page.getByRole("radio", { name: label });
  }

  /**
   * Get a text input setting by its label
   *
   * @param label - The label of the input
   * @returns Locator for the input
   */
  getTextInput(label: string): Locator {
    return this.page.getByLabel(label);
  }

  /**
   * Get a select/dropdown setting by its label
   *
   * @param label - The label of the select
   * @returns Locator for the select element
   */
  getSelect(label: string): Locator {
    return this.page.getByRole("combobox", { name: label });
  }

  /**
   * Toggle a boolean setting
   *
   * @param settingName - The name/label of the setting
   * @param value - The desired state (true = on, false = off)
   */
  async toggleSetting(settingName: string, value: boolean): Promise<void> {
    const toggle = this.getToggle(settingName);
    const currentState = await toggle.isChecked();

    if (currentState !== value) {
      await toggle.click();
    }
  }

  /**
   * Set a text input setting
   *
   * @param settingName - The name/label of the setting
   * @param value - The value to set
   */
  async setTextInput(settingName: string, value: string): Promise<void> {
    const input = this.getTextInput(settingName);
    await input.fill(value);
  }

  /**
   * Select an option from a dropdown setting
   *
   * @param settingName - The name/label of the setting
   * @param option - The option to select
   */
  async selectOption(settingName: string, option: string): Promise<void> {
    const select = this.getSelect(settingName);
    await select.click();
    await this.page.getByRole("option", { name: option }).click();
  }

  /**
   * Save all settings changes
   */
  async saveChanges(): Promise<void> {
    await this.saveButton.click();
    await this.waitForNotification("Settings saved", "success");
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    await this.resetButton.click();
    // Handle confirmation dialog if present
    const confirmButton = this.page.getByRole("button", { name: "Confirm" });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }

  /**
   * Navigate to a specific settings section
   *
   * @param sectionName - The name of the section
   */
  async goToSection(sectionName: string): Promise<void> {
    await this.page.getByRole("tab", { name: sectionName }).click();
  }

  /**
   * Verify a toggle is in the expected state
   *
   * @param settingName - The name/label of the setting
   * @param expectedState - The expected checked state
   */
  async verifyToggleState(settingName: string, expectedState: boolean): Promise<void> {
    const toggle = this.getToggle(settingName);
    const currentState = await toggle.isChecked();
    if (currentState !== expectedState) {
      throw new Error(
        `Toggle "${settingName}" expected to be ${expectedState ? "checked" : "unchecked"}, but is ${currentState ? "checked" : "unchecked"}`,
      );
    }
  }

  /**
   * Verify a text input has the expected value
   *
   * @param settingName - The name/label of the setting
   * @param expectedValue - The expected value
   */
  async verifyInputValue(settingName: string, expectedValue: string): Promise<void> {
    const input = this.getTextInput(settingName);
    await input.waitFor({ state: "visible" });
    const value = await input.inputValue();
    if (value !== expectedValue) {
      throw new Error(
        `Input "${settingName}" expected to have value "${expectedValue}", but has "${value}"`,
      );
    }
  }

  /**
   * Check if the save button is enabled
   *
   * @returns Promise resolving to true if save button is enabled
   */
  async isSaveEnabled(): Promise<boolean> {
    return await this.saveButton.isEnabled();
  }
}
