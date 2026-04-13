export async function getTravelRecommendations(
  userPreferences: any,
  viewHistory: any[],
  bookingHistory: any[],
  availablePackages: any[]
) {
  try {
    const response = await fetch("/api/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userPreferences,
        viewHistory,
        bookingHistory,
        availablePackages,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recommendations from server");
    }

    const { recommendedIds } = await response.json();
    return availablePackages.filter(p => recommendedIds.includes(p.id));
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    // Fallback to first 3 packages if API fails
    return availablePackages.slice(0, 3);
  }
}
