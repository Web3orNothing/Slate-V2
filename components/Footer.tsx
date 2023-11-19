import Image from "next/image";
import Pic from "@/assets/Footer.png";
import Pic1 from "@/assets/Footer1.png";
import Pic2 from "@/assets/Footer2.png";
import Pic3 from "@/assets/Footer3.png";
import Pic4 from "@/assets/Footer4.png";

const Footer = () => {
  return (
    <>
      <Image alt="" className="block sm:hidden" src={Pic} />
      <Image alt="" className="hidden sm:block md:hidden" src={Pic1} />
      <Image alt="" className="hidden md:block lg:hidden" src={Pic2} />
      <Image alt="" className="hidden lg:block xl:hidden" src={Pic3} />
      <Image alt="" className="hidden xl:block" src={Pic4} />
    </>
  );
};

export default Footer;
