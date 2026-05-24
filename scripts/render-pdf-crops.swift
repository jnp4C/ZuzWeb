import AppKit
import Foundation
import PDFKit

struct CropJob: Decodable {
  let pdfPath: String
  let page: Int
  let crop: [Double]
  let widths: [Int]
  let quality: Double
  let outputs: [String]
}

func fail(_ message: String) -> Never {
  FileHandle.standardError.write(Data((message + "\n").utf8))
  exit(1)
}

guard CommandLine.arguments.count == 2 else {
  fail("Usage: swift render-pdf-crops.swift manifest.json")
}

let manifestURL = URL(fileURLWithPath: CommandLine.arguments[1])
let manifestData = try Data(contentsOf: manifestURL)
let jobs = try JSONDecoder().decode([CropJob].self, from: manifestData)

for job in jobs {
  guard job.crop.count == 4 else {
    fail("Invalid crop for page \(job.page)")
  }

  guard job.widths.count == job.outputs.count else {
    fail("Widths and outputs do not match for page \(job.page)")
  }

  let pdfURL = URL(fileURLWithPath: job.pdfPath)
  guard let document = PDFDocument(url: pdfURL) else {
    fail("Could not open PDF: \(job.pdfPath)")
  }

  guard let page = document.page(at: job.page - 1) else {
    fail("Could not open page \(job.page) in \(job.pdfPath)")
  }

  let bounds = page.bounds(for: .mediaBox)
  let cropX = bounds.minX + job.crop[0] * bounds.width
  let cropYFromTop = job.crop[1] * bounds.height
  let cropWidth = job.crop[2] * bounds.width
  let cropHeight = job.crop[3] * bounds.height
  let cropY = bounds.maxY - cropYFromTop - cropHeight
  let cropRect = CGRect(x: cropX, y: cropY, width: cropWidth, height: cropHeight)

  for (index, targetWidth) in job.widths.enumerated() {
    let targetHeight = max(1, Int(round(Double(targetWidth) * cropRect.height / cropRect.width)))
    let outputURL = URL(fileURLWithPath: job.outputs[index])
    try FileManager.default.createDirectory(
      at: outputURL.deletingLastPathComponent(),
      withIntermediateDirectories: true
    )

    guard let rep = NSBitmapImageRep(
      bitmapDataPlanes: nil,
      pixelsWide: targetWidth,
      pixelsHigh: targetHeight,
      bitsPerSample: 8,
      samplesPerPixel: 4,
      hasAlpha: true,
      isPlanar: false,
      colorSpaceName: .deviceRGB,
      bytesPerRow: 0,
      bitsPerPixel: 0
    ) else {
      fail("Could not create bitmap for \(outputURL.path)")
    }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    guard let context = NSGraphicsContext.current?.cgContext else {
      fail("Could not create graphics context for \(outputURL.path)")
    }

    context.setFillColor(NSColor.white.cgColor)
    context.fill(CGRect(x: 0, y: 0, width: targetWidth, height: targetHeight))

    let scale = CGFloat(targetWidth) / cropRect.width
    context.translateBy(x: -cropRect.minX * scale, y: -cropRect.minY * scale)
    context.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: context)
    NSGraphicsContext.restoreGraphicsState()

    guard let data = rep.representation(
      using: .jpeg,
      properties: [.compressionFactor: max(0.0, min(1.0, job.quality))]
    ) else {
      fail("Could not encode JPEG for \(outputURL.path)")
    }

    try data.write(to: outputURL)
  }
}
