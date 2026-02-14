declare module "encoding-japanese" {
  type ConvertOption = {
    from: string;
    to: string;
    type?: "string" | "array" | "arraybuffer";
  };

  const Encoding: {
    convert(
      data: number[] | Uint8Array,
      options: ConvertOption
    ): number[] | string | ArrayBuffer;

    codeToString(data: number[]): string;
  };

  export default Encoding;
}