export default function ProgressBar({ progress }) {
  return (
    <div className="progress-bg w-full">
      <div
        className="progress-fill"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
}
