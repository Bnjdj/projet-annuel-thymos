"""
THYMOS — MMA Video Analyzer
Telecharge une video MMA, extrait les frames cles,
les analyse avec un modele de vision (LLaVA),
puis genere un rapport d'analyse complet.

Usage:
  python video-analyzer.py <youtube_url> [--output rapport.txt] [--frames 20]
  python video-analyzer.py <chemin_video_locale> [--output rapport.txt] [--frames 20]
"""

import subprocess
import sys
import os
import json
import base64
import argparse
import tempfile
import shutil
from pathlib import Path

# Config
OLLAMA_API = "http://localhost:11434/api/chat"
VISION_MODEL = "llava:7b"
MMA_MODEL = "thymos-mma"
FFMPEG_PATH = "C:/Users/VotreNom/ffmpeg/ffmpeg.exe"
YTDLP_CMD = "yt-dlp"

SCRIPT_DIR = Path(__file__).parent
KNOWLEDGE_DIR = SCRIPT_DIR / "knowledge"


def download_video(url, output_dir):
    """Telecharge une video YouTube via yt-dlp module Python"""
    import yt_dlp
    output_path = os.path.join(output_dir, "video.mp4")
    print(f"[1/4] Telechargement de la video...")
    ydl_opts = {
        "format": "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720]",
        "merge_output_format": "mp4",
        "outtmpl": output_path,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        print(f"Erreur telechargement: {e}")
        sys.exit(1)
    # yt-dlp might add extension
    if not os.path.exists(output_path):
        for f in os.listdir(output_dir):
            if f.startswith("video") and f.endswith(".mp4"):
                output_path = os.path.join(output_dir, f)
                break
    print(f"    Video telechargee: {output_path}")
    return output_path


def extract_frames(video_path, output_dir, num_frames=20):
    """Extrait des frames uniformement repartis de la video"""
    print(f"[2/4] Extraction de {num_frames} frames...")

    # Get video duration
    ffprobe_path = FFMPEG_PATH.replace("ffmpeg.exe", "ffprobe.exe")
    probe_cmd = [
        ffprobe_path,
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "json",
        video_path
    ]
    result = subprocess.run(probe_cmd, capture_output=True, text=True)
    duration = float(json.loads(result.stdout)["format"]["duration"])
    print(f"    Duree video: {int(duration)}s")

    # Calculate interval
    interval = duration / (num_frames + 1)
    frames = []

    for i in range(num_frames):
        timestamp = interval * (i + 1)
        frame_path = os.path.join(output_dir, f"frame_{i:03d}.jpg")

        cmd = [
            FFMPEG_PATH,
            "-ss", str(timestamp),
            "-i", video_path,
            "-vframes", "1",
            "-q:v", "2",
            "-y",
            frame_path
        ]
        subprocess.run(cmd, capture_output=True)

        if os.path.exists(frame_path):
            frames.append({
                "path": frame_path,
                "timestamp": timestamp,
                "time_str": f"{int(timestamp//60)}:{int(timestamp%60):02d}"
            })

    print(f"    {len(frames)} frames extraits")
    return frames


def encode_image(image_path):
    """Encode une image en base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def analyze_frame(image_path, timestamp_str, frame_num, total_frames):
    """Analyse un frame avec LLaVA"""
    import urllib.request

    image_b64 = encode_image(image_path)

    prompt = f"""Tu es un analyste MMA expert. Analyse cette image d'un combat/entrainement MMA.
Decris en detail:
1. La position des combattants (garde, stance, distance)
2. Les techniques visibles (coups, prises, positions au sol)
3. L'avantage tactique (qui domine, pourquoi)
4. Les erreurs techniques visibles
5. Ce qui va probablement se passer ensuite

Sois precis et utilise le vocabulaire technique MMA.
Frame {frame_num+1}/{total_frames} — Timestamp: {timestamp_str}"""

    data = json.dumps({
        "model": VISION_MODEL,
        "messages": [{
            "role": "user",
            "content": prompt,
            "images": [image_b64]
        }],
        "stream": False
    }).encode()

    req = urllib.request.Request(
        OLLAMA_API,
        data=data,
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
            return result["message"]["content"]
    except Exception as e:
        return f"[Erreur analyse frame: {e}]"


def generate_final_report(frame_analyses, video_url=""):
    """Genere le rapport final avec le modele MMA expert"""
    import urllib.request

    print(f"[4/4] Generation du rapport final...")

    # Load MMA knowledge for context
    knowledge_ctx = ""
    techniques_file = KNOWLEDGE_DIR / "techniques.txt"
    if techniques_file.exists():
        with open(techniques_file, "r", encoding="utf-8") as f:
            # Take first 3000 chars of techniques for context
            knowledge_ctx = f.read()[:3000]

    all_analyses = "\n\n".join([
        f"=== Frame {i+1} ({a['time']}) ===\n{a['analysis']}"
        for i, a in enumerate(frame_analyses)
    ])

    prompt = f"""Tu es THYMOS, coach IA expert MMA. Voici l'analyse frame-par-frame d'un combat/entrainement MMA.

ANALYSES DES FRAMES:
{all_analyses}

{f'CONNAISSANCES TECHNIQUES:{chr(10)}{knowledge_ctx}' if knowledge_ctx else ''}

A partir de ces analyses, genere un RAPPORT COMPLET qui inclut:

1. **RESUME DU COMBAT/ENTRAINEMENT**
   - Type (combat officiel, sparring, technique, pad work, etc.)
   - Styles des combattants identifies
   - Atmosphere generale

2. **ANALYSE TECHNIQUE**
   - Techniques utilisees par chaque combattant
   - Qualite d'execution (note /10 avec justification)
   - Patterns repetitifs (combinaisons favorites, tendances)

3. **ANALYSE TACTIQUE**
   - Qui impose le rythme et comment
   - Gestion de la distance
   - Transitions (debout -> sol, clinch -> frappe, etc.)
   - Utilisation de la cage (si applicable)

4. **POINTS FORTS IDENTIFIES**
   - Par combattant, avec exemples precis des frames

5. **POINTS A AMELIORER**
   - Erreurs techniques specifiques
   - Ouvertures non exploitees
   - Faiblesses defensives

6. **RECOMMANDATIONS D'ENTRAINEMENT**
   - Exercices specifiques pour corriger les faiblesses
   - Drills a ajouter
   - Points tactiques a travailler

Sois detaille, precis, et utilise le vocabulaire technique MMA."""

    data = json.dumps({
        "model": MMA_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "options": {"num_ctx": 32768}
    }).encode()

    req = urllib.request.Request(
        OLLAMA_API,
        data=data,
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            result = json.loads(resp.read())
            return result["message"]["content"]
    except Exception as e:
        return f"[Erreur generation rapport: {e}]"


def main():
    parser = argparse.ArgumentParser(description="THYMOS — Analyseur Video MMA")
    parser.add_argument("source", help="URL YouTube ou chemin vers fichier video")
    parser.add_argument("--output", "-o", default="", help="Fichier de sortie pour le rapport")
    parser.add_argument("--frames", "-f", type=int, default=15, help="Nombre de frames a analyser (defaut: 15)")
    parser.add_argument("--keep-frames", action="store_true", help="Garder les frames extraits")
    args = parser.parse_args()

    # Create temp directory
    work_dir = tempfile.mkdtemp(prefix="thymos_video_")
    frames_dir = os.path.join(work_dir, "frames")
    os.makedirs(frames_dir)

    try:
        # Step 1: Get video
        if args.source.startswith("http"):
            video_path = download_video(args.source, work_dir)
        else:
            video_path = args.source
            if not os.path.exists(video_path):
                print(f"Erreur: fichier introuvable: {video_path}")
                sys.exit(1)

        # Step 2: Extract frames
        frames = extract_frames(video_path, frames_dir, args.frames)
        if not frames:
            print("Erreur: aucun frame extrait")
            sys.exit(1)

        # Step 3: Analyze each frame with vision model
        print(f"[3/4] Analyse des frames avec IA vision ({len(frames)} frames)...")
        print(f"       (ca prend ~30-60s par frame sur CPU)")
        frame_analyses = []
        for i, frame in enumerate(frames):
            print(f"    Analyse frame {i+1}/{len(frames)} ({frame['time_str']})...", end=" ", flush=True)
            analysis = analyze_frame(frame["path"], frame["time_str"], i, len(frames))
            frame_analyses.append({
                "time": frame["time_str"],
                "analysis": analysis
            })
            print("OK")

        # Step 4: Generate final report
        report = generate_final_report(frame_analyses, args.source)

        # Output
        output_path = args.output
        if not output_path:
            output_path = os.path.join(
                str(SCRIPT_DIR),
                "last-analysis.txt"
            )

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"THYMOS — RAPPORT D'ANALYSE VIDEO MMA\n")
            f.write(f"{'='*50}\n")
            f.write(f"Source: {args.source}\n")
            f.write(f"Frames analyses: {len(frame_analyses)}\n")
            f.write(f"{'='*50}\n\n")
            f.write(report)
            f.write(f"\n\n{'='*50}\n")
            f.write(f"DETAIL PAR FRAME\n{'='*50}\n\n")
            for i, a in enumerate(frame_analyses):
                f.write(f"--- Frame {i+1} ({a['time']}) ---\n")
                f.write(a["analysis"])
                f.write("\n\n")

        print(f"\n{'='*50}")
        print(f"RAPPORT GENERE: {output_path}")
        print(f"{'='*50}")
        print(f"\nApercu:\n")
        print(report[:1000] + "..." if len(report) > 1000 else report)

        # Optionally keep frames
        if args.keep_frames:
            dest = os.path.join(str(SCRIPT_DIR), "last-frames")
            if os.path.exists(dest):
                shutil.rmtree(dest)
            shutil.copytree(frames_dir, dest)
            print(f"\nFrames gardes dans: {dest}")

    finally:
        # Cleanup
        if not args.keep_frames:
            shutil.rmtree(work_dir, ignore_errors=True)


if __name__ == "__main__":
    main()
