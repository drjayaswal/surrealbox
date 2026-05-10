export const FLORAL_IMAGE_IDS = [
  "1596394516093-501ba68a0ba6",
  "1526047932273-341f2a7631f9",
  "1518709268805-4e9042af9f23",
  "1550684848-fac1c5b4e853",
  "1490750967868-88aa3c1c20ae",
  "1470770841072-f978cf4d019e",
  "1533907650630-eb17a2a1f42e",
  "1464822759023-fed622ff2c3b",
  "1437333306633-0c970fff440a",
  "1507290439931-a8e92388c625",
  "1455243627252-429a2393e602",
  "1444492415967-3c6c0caad197",
  "1506082359-0142953b6811",
  "1528615363842-8c909695628a",
  "1500382017468-9049fed747ef"
];

export const getOptimizedUnsplashUrl = (id: string) => {
  // We use auto=format (chooses AVIF/WebP)
  // q=75 (perfect balance)
  // w=1200 (sufficient for a 42vw sidebar even on 1440p screens)
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=1200`;
};
