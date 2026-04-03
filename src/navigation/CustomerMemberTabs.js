// Root switcher — routes to CustomerTabs or MemberTabs based on role
import { useSelector } from "react-redux";
import CustomerTabs from "./CustomerTabs";
import MemberTabs   from "./MemberTabs";

export default function CustomerMemberTabs() {
  const { user } = useSelector((s) => s.auth);
  return user?.role === "member" ? <MemberTabs /> : <CustomerTabs />;
}
