import React from "react";
import Navbar from "./Navbar";
import "./PageLayout.css";

const PageLayout = ({ children }) => {
  return (
    <div>
      <Navbar />
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
