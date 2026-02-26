import React, { useState } from "react";
import DashboardHome from "./components/DashboardHome";
import CategoryScreen from "./components/CategoryScreen";
import TopIssuesScreen from "./components/TopIssuesScreen";
import "./styles.css";

function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleBack = () => setSelectedCategory(null);

  let content = (
    <DashboardHome onSelect={setSelectedCategory} />
  );

  if (selectedCategory === "DAILY_TOP_10") {
    content = <TopIssuesScreen onBack={handleBack} />;
  } else if (selectedCategory) {
    content = (
      <CategoryScreen
        category={selectedCategory}
        onBack={handleBack}
      />
    );
  }

  return <div className="app">{content}</div>;
}

export default App;