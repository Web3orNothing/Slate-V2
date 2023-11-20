import Image from "next/image";
import { styled } from "@mui/material/styles";

import FooterBg from "@/assets/Footer.png";
import LoopedSquare from "@/assets/cmd.png";

const CustomText = styled("div")({
  padding: "4px 0px 4px 0px",
});

const CustomButton = styled("div")({
  background: "rgba(255,255,255,0.3)",
  padding: "4px 8px 4px 8px",
  borderRadius: "6px",
});

const Footer = () => {
  return (
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
  );
};

export default Footer;
