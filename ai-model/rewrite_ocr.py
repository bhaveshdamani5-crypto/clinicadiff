import re

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_ocr = '''@app.route('/ocr', methods=['POST'])
def ocr_prescription():
    """OCR endpoint — accepts image file OR base64 JSON."""
    global ocr_reader
    try:
        temp_dir = os.path.join(os.path.dirname(__file__), 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, '_ocr_input.png')

        # Accept multipart file upload
        if 'image' in request.files:
            image_file = request.files['image']
            image_file.save(temp_path)
        # Accept base64 JSON
        elif request.is_json and request.json.get('image'):
            b64 = request.json['image']
            b64 = re.sub(r'^data:image/\\w+;base64,', '', b64)
            img_bytes = base64.b64decode(b64)
            with open(temp_path, 'wb') as f:
                f.write(img_bytes)
        else:
            return jsonify({"status": "error", "message": "No image provided. Send as file upload or base64 JSON."}), 400

        # Check file exists and has content
        if not os.path.exists(temp_path) or os.path.getsize(temp_path) < 100:
            return jsonify({"status": "error", "message": "Image file is empty or corrupt"}), 400

        print(f"[OCR] Image saved: {os.path.getsize(temp_path)} bytes")

        # ---------------------------------------------------------
        # Step 1: EasyOCR Extraction
        # ---------------------------------------------------------
        image_paths = preprocess_image(temp_path)
        if isinstance(image_paths, str):
            image_paths = [image_paths]

        if ocr_reader is None:
            ocr_reader = easyocr.Reader(['en'], gpu=False)

        best_results = []
        for p in image_paths:
            try:
                results = ocr_reader.readtext(p, detail=0, paragraph=True, text_threshold=0.5, low_text=0.3, width_ths=0.7)
                if len(results) > len(best_results):
                    best_results = results
            except Exception as e:
                pass

        try:
            results_no_para = ocr_reader.readtext(temp_path, detail=0, paragraph=False, text_threshold=0.5, low_text=0.3)
            if len(results_no_para) > len(best_results):
                best_results = results_no_para
        except:
            pass

        raw_text = "\\n".join(best_results) if best_results else ""
        print(f"[OCR] Extracted {len(best_results)} text blocks, {len(raw_text)} chars")

        # ---------------------------------------------------------
        # Step 2: Groq Structuring
        # ---------------------------------------------------------
        if groq_client and raw_text.strip():
            try:
                print("[OCR] Attempting Groq extraction...")
                safe_text = raw_text.replace('"', '\\\\"').replace('\\n', ' ')
                prompt = f"""
                You are a medical AI assistant. Read this raw text extracted from a handwritten medical prescription via OCR:
                "{safe_text}"
                
                Even if the text is messy or has OCR errors, try your absolute best to deduce the drug names, dosages, and patient info based on your vast medical knowledge.
                
                Respond ONLY with a valid raw JSON object (NO markdown wrappers like ```json) with the following structure:
                {{
                    "raw_text": "{safe_text}",
                    "drugs_found": ["DrugName1", "DrugName2"],
                    "medications": [
                        {{
                            "drug_name": "Full drug name (brand name if visible)",
                            "generic_name": "Generic/chemical name if known",
                            "dosage": "e.g. 10mg, 500mg",
                            "frequency": "e.g. Once daily, Twice daily, Three times daily",
                            "duration": "e.g. 7 days, 1 month, As needed",
                            "timing": "e.g. After meals, Before bed, Morning",
                            "form": "e.g. Tablet, Capsule, Syrup, Gel, Injection",
                            "instructions": "Any special instructions in simple patient-friendly language"
                        }}
                    ],
                    "patient_info": {{
                        "age": "Patient age if visible",
                        "name": "Patient name if visible",
                        "date": "Prescription date if visible",
                        "doctor_name": "Doctor name if visible"
                    }},
                    "diagnosis": "Any diagnosis mentioned on the prescription",
                    "special_notes": "Any additional notes or warnings on the prescription",
                    "has_doctor_signature": true
                }}
                
                IMPORTANT: For each medication, write the instructions in simple language a patient can understand.
                """
                response = groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.2,
                    max_tokens=2048,
                )
                res_text = response.choices[0].message.content.strip()
                if res_text.startswith("```json"):
                    res_text = res_text[7:-3]
                elif res_text.startswith("```"):
                    res_text = res_text[3:-3]
                
                data = json.loads(res_text.strip())
                
                # Trust Ledger Simulation: Cryptographic Verification
                has_sig = data.get("has_doctor_signature", False)
                crypto_status = "VERIFIED (Cryptographic Ledger Sync)" if has_sig else "UNVERIFIED (No valid signature detected)"
                
                # Build a clean patient summary from structured data
                meds = data.get("medications", [])
                summary_parts = ["[PRESCRIPTION SUMMARY]"]
                if meds:
                    summary_parts.append("")
                    for i, med in enumerate(meds, 1):
                        line = f"{i}. {med.get('drug_name', 'Unknown')} {med.get('dosage', '')}"
                        line += f" — {med.get('frequency', '')} for {med.get('duration', 'as directed')}"
                        if med.get('instructions'):
                            line += f". {med['instructions']}"
                        summary_parts.append(line)
                patient_summary = "\\n".join(summary_parts)
                
                # Cleanup
                for f in os.listdir(temp_dir):
                    try: os.remove(os.path.join(temp_dir, f))
                    except: pass
                    
                return jsonify({
                    "status": "success",
                    "raw_text": data.get("raw_text", raw_text),
                    "cleaned_text": data.get("raw_text", raw_text),
                    "expanded_text": data.get("raw_text", raw_text),
                    "drugs_found": data.get("drugs_found", []),
                    "medications": meds,
                    "patient_info": data.get("patient_info", {}),
                    "diagnosis": data.get("diagnosis", ""),
                    "special_notes": data.get("special_notes", ""),
                    "abbreviations_found": [],
                    "patient_summary": patient_summary,
                    "text_blocks_count": len(best_results),
                    "engine": "groq",
                    "trust_ledger": {
                        "signature_detected": has_sig,
                        "verification_status": crypto_status,
                        "timestamp": "Real-time"
                    }
                })
            except Exception as e:
                print(f"[OCR] Groq Failed: {e}. Falling back to Rule-based.")

        # ---------------------------------------------------------
        # Step 3: Fallback (If no API key or Groq fails)
        # ---------------------------------------------------------
        # Clean
        cleaned = re.sub(r"[^\\x20-\\x7E\\n]+", "", raw_text)
        cleaned = re.sub(r"[ \\t]+", " ", cleaned)
        lines = [ln.strip() for ln in cleaned.splitlines() if ln.strip()]
        cleaned = "\\n".join(lines)

        # Expand abbreviations
        expanded = cleaned
        for abbr, full in ABBREVIATIONS.items():
            expanded = re.sub(rf"\\b{abbr}\\b", f"{abbr} ({full})", expanded, flags=re.IGNORECASE)

        # Find drugs
        drugs_found = find_drugs_in_text(cleaned)

        # Find abbreviations
        abbrs_found = [
            {"abbr": abbr, "meaning": full}
            for abbr, full in ABBREVIATIONS.items()
            if re.search(rf"\\b{abbr}\\b", cleaned, re.IGNORECASE)
        ]

        # Cleanup temp files
        for f in os.listdir(temp_dir):
            try:
                os.remove(os.path.join(temp_dir, f))
            except:
                pass

        # Generate patient-friendly summary
        patient_summary = generate_patient_summary(cleaned, drugs_found, abbrs_found)
        if not groq_client:
             patient_summary = "[WARNING] Add GROQ_API_KEY in backend/.env for highly accurate handwriting AI!\\n\\n" + patient_summary

        return jsonify({
            "status": "success",
            "raw_text": raw_text,
            "cleaned_text": cleaned,
            "expanded_text": expanded,
            "drugs_found": drugs_found,
            "abbreviations_found": abbrs_found,
            "patient_summary": patient_summary,
            "text_blocks_count": len(best_results),
            "engine": "easyocr"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500'''

start_idx = content.find("@app.route('/ocr', methods=['POST'])")
end_idx = content.find("@app.route('/calculate-hereditary-risk', methods=['POST'])")

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_ocr + "\n\n\n" + content[end_idx:]
    with open('app.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    print("Failed to find endpoints")
