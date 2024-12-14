export default function useConver() {
  const triggerUnit = 0.0137;
  const sensitivityUnit = 0.01176;

  const triggerToPage = (value: number) => {
    return (value * triggerUnit).toFixed(1);
  };
  const PageToTrigger = (value: number) => {
    return (value / triggerUnit).toFixed();
  };
  const sensitivityToPage = (value: number) => {
    return (value * sensitivityUnit).toFixed(2);
  };
  const PageToSensitivity = (value: number) => {
    return (value / sensitivityUnit).toFixed();
  };

  return {
    triggerToPage,
    PageToTrigger,
    sensitivityToPage,
    PageToSensitivity
  };
}
