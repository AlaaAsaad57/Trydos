import ScreenSkeleton from "components/DemoApp1/ScreenSkeleton";

/**
 * Shown while a shopper goes to their settings: the shape of the profile tab,
 * which is what that address draws now.
 */
function SettingsLoader() {
  return (
    <div data-pw="settings-loader" aria-hidden="true">
      <ScreenSkeleton screen="settings" />
    </div>
  );
}

export default SettingsLoader;
