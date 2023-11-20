import Image from "next/image";
import { styled } from "@mui/material/styles";

import FooterBg from "@/assets/Footer.png";
import LoopedSquare from "@/assets/loppedSquare.png";

const CustomText = styled("div")({
  padding: "4px 0px 4px 0px",
});

const CustomButton = styled("div")({
  background: "gray",
  padding: "4px 10px 4px 10px",
  borderRadius: "6px",
});

const Footer = () => {
  return (
    <>
      {/* <Image alt="" className="block sm:hidden" src={Pic} />
      <Image alt="" className="hidden sm:block md:hidden" src={Pic1} />
      <Image alt="" className="hidden md:block lg:hidden" src={Pic2} />
      <Image alt="" className="hidden lg:block xl:hidden" src={Pic3} />
      <Image alt="" className="hidden xl:block" src={Pic4} /> */}
      <div
        className="bg-cover h-[42px]"
        style={{ backgroundImage: `url(${FooterBg.src})` }}
      >
        <div className="hidden sm:flex gap-1 justify-center text-white text-[12px] py-2">
          <CustomText>Hit</CustomText>
          <CustomButton>R</CustomButton>
          <CustomButton>R</CustomButton>
          <CustomButton>R</CustomButton>
          <CustomButton>R</CustomButton>
          <CustomText>to switch tabs &bull;</CustomText>
          <CustomButton style={{ display: "flex", alignItems: "center" }}>
            <Image alt="" width={12} src={LoopedSquare} />
          </CustomButton>
          <CustomButton>K</CustomButton>
          <CustomText>to type &bull;</CustomText>
          <CustomButton>enter</CustomButton>
          <CustomText>to go &bull;</CustomText>
          <CustomButton style={{ display: "flex", alignItems: "center" }}>
            <Image alt="" width={12} src={LoopedSquare} />
          </CustomButton>
          <CustomButton>enter</CustomButton>
          <CustomText>to execute</CustomText>
        </div>
      </div>
    </>
  );
};

export default Footer;
