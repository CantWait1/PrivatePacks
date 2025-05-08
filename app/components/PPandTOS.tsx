import React from "react";
import { nexaLight } from "@/fonts/fonts";
import { nexaHeavy } from "@/fonts/fonts";
import Link from "next/link";

const PPandTOS = () => {
  return (
    <div
      className={`bg-black text-white min-h-screen p-8 space-y-10 ${nexaLight.className}`}
    >
      <h1 className={`text-4xl ${nexaHeavy.className}`}>
        Terms of Service & Privacy Policy
      </h1>

      <section className="space-y-4">
        <h2 className={`text-2xl ${nexaHeavy.className}`}>
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using Private Packs (https://www.privatepacks.net),
          you agree to these Terms of Service and our Privacy Policy. If you do
          not agree, please do not use our services.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={`text-2xl ${nexaHeavy.className}`}>2. User Accounts</h2>
        <p>
          An account is required to download any texture packs. You are
          responsible for keeping your login credentials secure and for all
          activity under your account.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={`text-2xl ${nexaHeavy.className}`}>3. Texture Packs</h2>
        <p>
          The texture packs available on Private Packs are not created or owned
          by us. We host them solely for convenience and accessibility. All
          credit belongs to the original creators.
        </p>
        <p>
          If you are a content owner and wish to request removal or attribution,
          please contact us at{" "}
          <a
            href="https://discord.gg/XeJsHdPnNm"
            className="underline text-blue-400"
          >
            https://discord.gg/XeJsHdPnNm
          </a>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={`text-2xl ${nexaHeavy.className}`}>
          4. Public Content & Profiles
        </h2>
        <p>
          Users can post content, chat, and interact on the platform. All posts
          and chats must follow our community rules — offensive, hateful, or
          harmful content will not be tolerated.
        </p>
        <p>
          User profiles are publicly visible to other users. Do not share
          sensitive personal information on your profile or in posts.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={`text-2xl ${nexaHeavy.className}`}>
          5. Intellectual Property
        </h2>
        <p>
          The name Private Packs is not our property; however, the logo and branding are our exclusive property and may not be used, copied, or distributed without written permission.
        </p>
        <p>
          All third-party content remains the property of its original owners.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={`text-2xl ${nexaHeavy.className}`}>6. Disclaimers</h2>
        <p>
          Private Packs is not affiliated with Mojang, Microsoft, or Minecraft.
          We do not guarantee availability, speed, or accuracy of any pack or
          download.
        </p>
        <p>
          All content is provided "as is" and may be removed or modified at any
          time.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={`text-2xl ${nexaHeavy.className}`}>7. Privacy Policy</h2>
        <p>
          We only collect your email address for account creation and login. We
          do not collect sensitive personal data, and your information is never
          sold or shared with third parties.
        </p>
        <p>
          Your email is stored securely and used solely for platform-related
          communication and authentication.
        </p>
        <p>Cookies may be used to manage sessions and site functionality.</p>
        <p>
          You may request deletion of your account and email data at any time by
          contacting us at{" "}
          <a
            href="https://discord.gg/XeJsHdPnNm"
            className="underline text-blue-400"
          >
            https://discord.gg/XeJsHdPnNm
          </a>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={`text-2xl ${nexaHeavy.className}`}>
          8. Updates to These Terms
        </h2>
        <p>
          We reserve the right to modify these Terms and our Privacy Policy at
          any time. Your continued use of the platform constitutes acceptance of
          any changes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={`text-2xl ${nexaHeavy.className}`}>9. Contact</h2>
        <p>
          For any questions, complaints, or removal requests, please contact us
          at{" "}
          <a
            href="https://discord.gg/XeJsHdPnNm"
            className="underline text-blue-400"
          >
            https://discord.gg/XeJsHdPnNm
          </a>
          .
        </p>
      </section>

      <div className="flex justify-center items-center">
        <Link href="/" className="text-5xl">
          Home
        </Link>
      </div>
    </div>
  );
};

export default PPandTOS;
