import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TopNav from "../../components/ui/TopNav";
import { COLORS, FONTS, SIZES } from "../../utils/constants";

const SECTIONS = [
  {
    title: "OVERVIEW",
    body: `Albos Pvt. Ltd. ("we", "us", "our") operates the ApnoGarage mobile application. This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.

We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.`,
  },
  {
    title: "SECTION 1 – INFORMATION WE COLLECT",
    body: `We collect several different types of information for various purposes to provide and improve our Service to you.

Personal Data: While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include:
• Mobile phone number
• Full name and email address
• Garage name, address, and contact details
• GST number (if applicable)
• Profile photos / garage logo
• Device information and usage data

Usage Data: We may also collect information about how the Service is accessed and used ("Usage Data"). This may include information such as your device's Internet Protocol address (IP address), device type, operating system, the pages of our Service that you visit, the time and date of your visit, and other diagnostic data.`,
  },
  {
    title: "SECTION 2 – HOW WE USE YOUR INFORMATION",
    body: `Albos Pvt. Ltd. uses the collected data for various purposes:

• To provide and maintain the Service
• To notify you about changes to our Service
• To allow you to participate in interactive features of our Service when you choose to do so
• To provide customer support
• To gather analysis or valuable information so that we can improve the Service
• To monitor the usage of the Service
• To detect, prevent and address technical issues
• To send you SMS notifications related to your account and garage operations`,
  },
  {
    title: "SECTION 3 – OTP VERIFICATION",
    body: `We use One-Time Password (OTP) verification via SMS to authenticate users. When you register or log in:

• Your mobile number is stored securely in our database
• An OTP is generated and sent via our SMS gateway (Fast2SMS)
• OTPs expire within a short time window and are hashed before storage
• We do not store plain-text OTPs

Your phone number is used solely for authentication and service-related communications.`,
  },
  {
    title: "SECTION 4 – DATA RETENTION",
    body: `We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our legal agreements and policies.

Garage and account data is retained for the duration of your active subscription/use. Upon account deletion request, your data will be removed within 30 days, except where retention is required by applicable law.`,
  },
  {
    title: "SECTION 5 – DATA TRANSFER",
    body: `Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.

If you are located outside India and choose to provide information to us, please note that we transfer the data, including Personal Data, to India and process it there.

Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.`,
  },
  {
    title: "SECTION 6 – DISCLOSURE OF DATA",
    body: `Albos Pvt. Ltd. may disclose your Personal Data in the good faith belief that such action is necessary to:

• Comply with a legal obligation
• Protect and defend the rights or property of Albos Pvt. Ltd.
• Prevent or investigate possible wrongdoing in connection with the Service
• Protect the personal safety of users of the Service or the public
• Protect against legal liability

We do not sell, trade, or otherwise transfer your personally identifiable information to third parties without your consent, except as described in this Privacy Policy.`,
  },
  {
    title: "SECTION 7 – SECURITY OF DATA",
    body: `The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.

We implement the following security measures:
• JWT-based authentication with short-lived access tokens
• Hashed OTP storage
• HTTPS encrypted data transmission
• Role-based access control`,
  },
  {
    title: "SECTION 8 – YOUR DATA RIGHTS",
    body: `You have the following rights regarding your personal data:

• Right to Access: You can request a copy of the personal data we hold about you.
• Right to Rectification: You can request correction of inaccurate or incomplete data.
• Right to Erasure: You can request deletion of your personal data from our systems.
• Right to Restrict Processing: You can ask us to limit how we use your data.
• Right to Data Portability: You can request a copy of your data in a structured format.

To exercise any of these rights, please contact us at support@albos.com.`,
  },
  {
    title: "SECTION 9 – THIRD-PARTY SERVICES",
    body: `Our Service may contain links to other sites that are not operated by us. If you click a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.

We use the following third-party services:
• Fast2SMS – for OTP delivery
• MongoDB Atlas – for secure cloud data storage
• Expo / React Native – for application delivery

We have no control over and assume no responsibility for the content, privacy policies or practices of any third-party sites or services.`,
  },
  {
    title: "SECTION 10 – CHILDREN'S PRIVACY",
    body: `Our Service does not address anyone under the age of 18 ("Children").

We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.`,
  },
  {
    title: "SECTION 11 – CHANGES TO THIS PRIVACY POLICY",
    body: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.

You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page. Your continued use of the Service after any change constitutes your acceptance of the new Privacy Policy.`,
  },
  {
    title: "SECTION 12 – CONTACT US",
    body: `If you have any questions about this Privacy Policy, please contact us:

Albos Pvt. Ltd.
Contact: Chandra Prakash
Email: albostechnologies016@gmail.com
Support: support@albos.com`,
  },
];

export default function PrivacyPolicy({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgCard} />
      <TopNav
        title="Privacy Policy"
        showBack
        onBackPress={() => navigation.goBack()}
        transparent={false}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerMeta}>Albos Pvt. Ltd. · Last updated: 2025</Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((sec, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec.title}</Text>
            <Text style={styles.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Albos Pvt. Ltd. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.xxl,
  },
  header: {
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SIZES.md,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerMeta: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.textSm ?? 13,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: SIZES.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: SIZES.radiusMd ?? 12,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: SIZES.textSm ?? 13,
    color: COLORS.primary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: SIZES.sm,
  },
  sectionBody: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  footer: {
    paddingTop: SIZES.md,
    alignItems: "center",
  },
  footerText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
