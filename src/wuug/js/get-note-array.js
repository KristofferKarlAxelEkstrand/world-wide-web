export function getNoteArray() {
	const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const notes = [];
	for (let midi = 12; midi <= 120; midi++) {
		const arrayIndex = midi - 12;
		const octave = Math.floor(midi / 12) - 1;
		const name = noteNames[midi % 12] + octave;
		const frequency = 440 * Math.pow(2, (midi - 69) / 12);
		notes.push({ arrayIndex, midi, name, frequency });
	}
	return notes;
}
