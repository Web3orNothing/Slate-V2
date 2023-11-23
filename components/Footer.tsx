import Image from "next/image";
import { styled } from "@mui/material/styles";

import FooterBg from "@/assets/Footer.png";
import LoopedSquare from "@/assets/cmd.png";

const CustomText = styled("div")({
  padding: "4px 0px 4px 0px",
});

const CustomButton = styled("div")({
  background: "rgba(255,255,255,0.3)",
  width: "20px",
  height: "20px",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
});

const Footer = () => {
  return (
    <div
      className="bg-cover h-[32px] flex justify-center items-center"
      style={{ backgroundImage: `url(${FooterBg.src})` }}
    >
      <div className="hidden sm:flex gap-1 justify-center text-white text-[12px]">
        <CustomText>Hit</CustomText>
        <CustomButton>R</CustomButton>
        <CustomButton>E</CustomButton>
        <CustomButton>W</CustomButton>
        <CustomButton>Q</CustomButton>
        <CustomText>to switch tabs &bull;</CustomText>
        <CustomButton style={{ display: "flex", alignItems: "center" }}>
          <Image alt="" width={12} src={LoopedSquare} />
        </CustomButton>
        <CustomButton>K</CustomButton>
        <CustomText>to type &bull;</CustomText>
        <CustomButton style={{ width: "43px" }}>enter</CustomButton>
        <CustomText>to go &bull;</CustomText>
        <CustomButton style={{ display: "flex", alignItems: "center" }}>
          <Image alt="" width={12} src={LoopedSquare} />
        </CustomButton>
        <CustomButton style={{ width: "43px" }}>enter</CustomButton>
        <CustomText>to execute</CustomText>
      </div>
    </div>
  );
};

export default Footer;
