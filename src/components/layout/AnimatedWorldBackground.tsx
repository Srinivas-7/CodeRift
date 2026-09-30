"use client";

import React, { useEffect, useState } from "react";

export function AnimatedWorldBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="animated-world-bg" aria-hidden="true">
      {/* Sky Canvas Gradient */}
      <div className="world-sky" />

      {/* Cyber / Pixel Stars in Dark Mode */}
      <div className="world-stars" />

      {/* Moving Air / Slow Drifting Clouds Layer */}
      <div className="world-clouds-container">
        {/* Cloud 1 */}
        <div className="cloud cloud-1">
          <svg width="180" height="70" viewBox="0 0 180 70" fill="none">
            <path
              d="M30 50 C20 50 10 40 10 30 C10 18 22 10 35 12 C42 4 56 0 70 4 C84 8 92 20 95 30 C105 28 118 34 120 44 C128 44 135 50 135 58 C135 66 126 70 118 70 L30 70 Z"
              className="cloud-fill"
            />
          </svg>
        </div>

        {/* Cloud 2 */}
        <div className="cloud cloud-2">
          <svg width="240" height="90" viewBox="0 0 240 90" fill="none">
            <path
              d="M40 65 C25 65 15 52 15 38 C15 22 30 12 48 15 C58 5 76 0 95 5 C115 10 125 26 130 38 C144 35 162 43 165 56 C176 56 186 64 186 75 C186 85 174 90 162 90 L40 90 Z"
              className="cloud-fill"
            />
          </svg>
        </div>

        {/* Cloud 3 */}
        <div className="cloud cloud-3">
          <svg width="160" height="60" viewBox="0 0 160 60" fill="none">
            <path
              d="M25 45 C15 45 8 36 8 26 C8 15 18 8 30 10 C36 3 48 0 60 3 C72 6 78 17 82 26 C90 24 102 30 104 38 C110 38 118 43 118 50 C118 57 110 60 102 60 L25 60 Z"
              className="cloud-fill"
            />
          </svg>
        </div>

        {/* Cloud 4 */}
        <div className="cloud cloud-4">
          <svg width="220" height="80" viewBox="0 0 220 80" fill="none">
            <path
              d="M35 58 C22 58 12 47 12 34 C12 20 26 11 42 13 C51 4 68 0 85 4 C102 9 111 23 115 34 C128 31 144 38 147 50 C156 50 165 57 165 67 C165 76 154 80 144 80 L35 80 Z"
              className="cloud-fill"
            />
          </svg>
        </div>

        {/* Cloud 5 */}
        <div className="cloud cloud-5">
          <svg width="190" height="75" viewBox="0 0 190 75" fill="none">
            <path
              d="M30 55 C18 55 10 44 10 32 C10 19 24 10 38 12 C46 4 62 0 78 4 C94 9 102 22 106 32 C118 29 132 36 135 48 C144 48 152 55 152 64 C152 72 142 75 132 75 L30 75 Z"
              className="cloud-fill"
            />
          </svg>
        </div>
      </div>

      {/* Gentle Wind Breeze Currents */}
      <div className="wind-container">
        <div className="wind-line wind-1" />
        <div className="wind-line wind-2" />
        <div className="wind-line wind-3" />
      </div>

      {/* Layered Grass & Solid Earth Ground with Animated Flowers */}
      <div className="world-grass-wrapper">
        {/* Back Grass Hill */}
        <div className="grass-layer grass-back">
          <svg
            className="grass-svg"
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0,80 C240,45 480,95 720,60 C960,25 1200,85 1440,55 L1440,200 L0,200 Z"
              className="grass-back-fill"
            />
          </svg>
        </div>

        {/* Mid Grass Hill */}
        <div className="grass-layer grass-mid">
          <svg
            className="grass-svg"
            viewBox="0 0 1440 180"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0,60 C300,90 600,40 900,75 C1200,105 1350,55 1440,70 L1440,180 L0,180 Z"
              className="grass-mid-fill"
            />
          </svg>
        </div>

        {/* Front Grass Hill with Solid Earth Ground Base */}
        <div className="grass-layer grass-front">
          <svg
            className="grass-svg"
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0,50 C200,30 400,70 650,40 C900,15 1150,65 1440,35 L1440,160 L0,160 Z"
              className="grass-front-fill"
            />
          </svg>
        </div>

        {/* Solid Ground / Earth Soil Strip at the Base */}
        <div className="world-ground-base">
          <div className="ground-texture" />
        </div>

        {/* Wind-Swaying Flowers Planted Across the Ground */}
        <div className="world-flowers-container">
          {/* Flower 1: Yellow Sunflower (Left) */}
          <div className="swaying-flower flower-pos-1">
            <div className="flower-stem" />
            <div className="flower-leaf leaf-left" />
            <div className="flower-head flower-yellow">
              <div className="flower-core" />
            </div>
          </div>

          {/* Flower 2: Pink Tulip (Left-Center) */}
          <div className="swaying-flower flower-pos-2">
            <div className="flower-stem stem-short" />
            <div className="flower-leaf leaf-right" />
            <div className="flower-head flower-pink">
              <div className="flower-core" />
            </div>
          </div>

          {/* Flower 3: Cyan Bell (Center) */}
          <div className="swaying-flower flower-pos-3">
            <div className="flower-stem" />
            <div className="flower-leaf leaf-left" />
            <div className="flower-head flower-cyan">
              <div className="flower-core" />
            </div>
          </div>

          {/* Flower 4: Yellow Daisy (Center-Right) */}
          <div className="swaying-flower flower-pos-4">
            <div className="flower-stem stem-tall" />
            <div className="flower-leaf leaf-right" />
            <div className="flower-head flower-yellow">
              <div className="flower-core" />
            </div>
          </div>

          {/* Flower 5: Purple Blossom (Right) */}
          <div className="swaying-flower flower-pos-5">
            <div className="flower-stem" />
            <div className="flower-leaf leaf-left" />
            <div className="flower-head flower-purple">
              <div className="flower-core" />
            </div>
          </div>

          {/* Flower 6: Red Poppy (Far Right) */}
          <div className="swaying-flower flower-pos-6">
            <div className="flower-stem stem-short" />
            <div className="flower-leaf leaf-right" />
            <div className="flower-head flower-pink">
              <div className="flower-core" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
