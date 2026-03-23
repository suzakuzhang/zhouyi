interface TextLayerLabelProps {
  layer: "经文" | "传文" | "系统说明" | "系统摘要";
}

const styles: Record<string, string> = {
  "经文": "bg-amber-100 text-amber-800",
  "传文": "bg-blue-100 text-blue-800",
  "系统说明": "bg-gray-100 text-gray-600",
  "系统摘要": "bg-green-100 text-green-700",
};

export default function TextLayerLabel({ layer }: TextLayerLabelProps) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded ${styles[layer] ?? styles["系统说明"]}`}>
      {layer}
    </span>
  );
}
