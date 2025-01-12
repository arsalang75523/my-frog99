/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from "frog";
import { devtools } from "frog/dev";
import { handle } from "frog/next";
import { serveStatic } from "frog/serve-static";
import { getFarcasterUserDetails } from "@airstack/frames";

const app = new Frog({
  assetsPath: "/",
  basePath: "/api",
  title: "Frog Frame",
});

const API_KEY = "13827f8b8c521443da97ed54d4d6a891";

// Fetch live prices from CoinGecko
const fetchLivePrices = async () => {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=moxie,ethereum&vs_currencies=usd"
  );
  const data = await response.json();
  return {
    moxiePriceUSD: data?.moxie?.usd || 0.01,
    ethPriceUSD: data?.ethereum?.usd || 1600,
  };
};

// Fetch Moxie earnings for a user
const fetchMoxieEarnings = async (fid) => {
  const query = `
    query {
      FarcasterMoxieEarningStats(
        input: {
          timeframe: LIFETIME,
          blockchain: ALL,
          filter: {
            entityType: {_eq: USER},
            entityId: {_eq: "${fid}"}
          }
        }
      ) {
        FarcasterMoxieEarningStat {
          allEarningsAmount
        }
      }
    }
  `;

  const response = await fetch("https://api.airstack.xyz/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  const result = await response.json();
  return result.data?.FarcasterMoxieEarningStats?.FarcasterMoxieEarningStat?.[0]?.allEarningsAmount || 0;
};

app.frame("/", async (c) => {
  const { inputText, status } = c;

  if (status === "response" && inputText) {
    try {
      const { init } = await import("@airstack/frames");
      init(API_KEY);

      const fid = inputText;

      // Fetch Farcaster user details
      const userDetails = await getFarcasterUserDetails({ fid });
      if (userDetails.error) throw new Error(userDetails.error);

      const {
        data: { profileName, profileImage },
      } = userDetails;

      // Fetch Moxie earnings
      const moxieEarnings = await fetchMoxieEarnings(fid);

      // Fetch live prices
      const { moxiePriceUSD, ethPriceUSD } = await fetchLivePrices();

      // Calculations
      const moxieEarningsUSD = (moxieEarnings * moxiePriceUSD).toFixed(2);
      const moxieEarningsETH = (moxieEarningsUSD / ethPriceUSD).toFixed(4);

      return c.res({
        image: (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              background: "linear-gradient(135deg, #1e1e2e, #232529)",
              height: "100vh",
              padding: "50px",
              boxSizing: "border-box",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "4rem",
                fontWeight: "bold",
                marginBottom: "20px",
                color: "#61dafb",
              }}
            >
              {profileName || "Unknown User"}
            </h1>
            {profileImage?.large && (
              <img
                src={profileImage.large}
                alt="Profile"
                style={{
                  borderRadius: "50%",
                  width: "150px",
                  height: "150px",
                  marginBottom: "30px",
                  border: "5px solid #61dafb",
                }}
              />
            )}
            <h2
              style={{
                fontSize: "2.5rem",
                marginBottom: "20px",
                color: "#61dafb",
                borderBottom: "3px solid #61dafb",
                paddingBottom: "10px",
              }}
            >
              Total Moxie Earnings
            </h2>
            <p
              style={{
                fontSize: "2rem",
                margin: "10px 0",
                color: "#c9d1d9",
              }}
            >
              {Number(moxieEarnings).toLocaleString()} Moxie
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "30px", // Increased gap for better alignment
                marginTop: "20px",
              }}
            >
              {/* Moxie in USD */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "2.5rem", // Increased size
                  color: "#61dafb",
                }}
              >
                <img
                  src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
                  alt="USD Logo"
                  style={{ width: "32px", height: "32px", marginRight: "12px" }}
                />
                <span>${moxieEarningsUSD}</span>
              </div>
              {/* Moxie in ETH */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "2.5rem", // Increased size
                  color: "#61dafb",
                }}
              >
                <img
                  src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                  alt="Ethereum Logo"
                  style={{ width: "32px", height: "32px", marginRight: "12px" }}
                />
                <span>{moxieEarningsETH} ETH</span>
              </div>
            </div>
          </div>
        ),
        intents: [<Button.Reset>Reset</Button.Reset>],
      });
    } catch (err) {
      return c.res({
        image: (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "red",
              background: "black",
              height: "100vh",
              padding: "50px",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "3rem" }}>Error fetching details</h2>
            <p style={{ fontSize: "2rem" }}>{err.message || "An unknown error occurred."}</p>
          </div>
        ),
        intents: [<Button.Reset>Reset</Button.Reset>],
      });
    }
  }

  return c.res({
    image: (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          background: "linear-gradient(135deg, #232529, #1e1e2e)",
          height: "100vh",
          padding: "50px",
        }}
      >
        <h1
          style={{
            fontSize: "4.5rem",
            fontWeight: "bold",
            color: "#61dafb",
          }}
        >
          Welcome!
        </h1>
        <p
          style={{
            fontSize: "2rem",
            color: "#c9d1d9",
            margin: "30px 0",
          }}
        >
          Enter Farcaster FID to get started
        </p>
      </div>
    ),
    intents: [
      <TextInput
        placeholder="Enter Farcaster FID..."
        style={{
          padding: "15px",
          borderRadius: "8px",
          border: "3px solid #61dafb",
          fontSize: "1.8rem",
          marginBottom: "20px",
        }}
      />,
      <Button
        value="Fetch"
        style={{
          background: "#61dafb",
          color: "black",
          padding: "15px 30px",
          borderRadius: "8px",
          fontSize: "1.8rem",
          cursor: "pointer",
          border: "none",
        }}
      >
        Fetch Details
      </Button>,
    ],
  });
});

devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
