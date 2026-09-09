import { Drawing, DrawingMetadata } from '../types/drawing';
import { Space } from '../types/space';
import { firestore, storage, isFirebaseConfigured } from './firebaseClient';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class DrawingService {
  /**
   * Uploads a PDF file either to Firebase Storage or backend storage.
   */
  static async uploadPdf(file: File): Promise<{ fileUrl: string; fileName: string }> {
    if (isFirebaseConfigured && storage) {
      const storageRef = ref(storage, `drawings/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(snapshot.ref);
      return { fileUrl, fileName: file.name };
    }

    // Backend endpoint fallback
    const formData = new FormData();
    formData.append('pdf', file);

    const res = await fetch('/api/drawings/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Failed to upload PDF: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Saves or updates a drawing and all its annotations.
   */
  static async saveDrawing(drawing: Drawing): Promise<Drawing> {
    const timestamp = new Date().toISOString();
    const updatedDrawing: Drawing = {
      ...drawing,
      updatedAt: timestamp,
      measurementCount: drawing.annotations.length
    };

    if (isFirebaseConfigured && firestore) {
      // 1. Save top-level drawing doc
      const drawingRef = doc(firestore, 'drawings', drawing.id);
      const { annotations, ...metadata } = updatedDrawing;
      await setDoc(drawingRef, metadata);

      // 2. Save each annotation in subcollection
      for (const ann of annotations) {
        const annRef = doc(firestore, `drawings/${drawing.id}/annotations`, ann.id);
        await setDoc(annRef, ann);
      }
      return updatedDrawing;
    }

    // Call backend API
    const res = await fetch('/api/drawings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDrawing)
    });

    if (!res.ok) {
      throw new Error(`Failed to save drawing: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Fetches all saved drawings metadata.
   */
  static async getDrawings(): Promise<DrawingMetadata[]> {
    if (isFirebaseConfigured && firestore) {
      const drawingsCol = collection(firestore, 'drawings');
      const q = query(drawingsCol, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DrawingMetadata);
    }

    const res = await fetch('/api/drawings');
    if (!res.ok) {
      throw new Error(`Failed to fetch drawings: ${res.statusText}`);
    }
    return await res.json();
  }

  /**
   * Fetches a specific drawing with all its annotations.
   */
  static async getDrawingById(drawingId: string): Promise<Drawing> {
    if (isFirebaseConfigured && firestore) {
      const drawingRef = doc(firestore, 'drawings', drawingId);
      const docSnap = await getDoc(drawingRef);
      if (!docSnap.exists()) {
        throw new Error('Drawing not found');
      }

      const metadata = docSnap.data() as DrawingMetadata;

      // Fetch annotations subcollection
      const annotationsCol = collection(firestore, `drawings/${drawingId}/annotations`);
      const annSnapshot = await getDocs(annotationsCol);
      const annotations = annSnapshot.docs.map(d => d.data() as Space);

      return {
        ...metadata,
        annotations
      };
    }

    const res = await fetch(`/api/drawings/${drawingId}`);
    if (!res.ok) {
      throw new Error(`Failed to load drawing: ${res.statusText}`);
    }
    return await res.json();
  }

  /**
   * Deletes a drawing and its annotations.
   */
  static async deleteDrawing(drawingId: string): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      // 1. Delete annotations subcollection
      const annotationsCol = collection(firestore, `drawings/${drawingId}/annotations`);
      const annSnapshot = await getDocs(annotationsCol);
      for (const d of annSnapshot.docs) {
        await deleteDoc(d.ref);
      }

      // 2. Delete drawing doc
      const drawingRef = doc(firestore, 'drawings', drawingId);
      await deleteDoc(drawingRef);
      return;
    }

    const res = await fetch(`/api/drawings/${drawingId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error(`Failed to delete drawing: ${res.statusText}`);
    }
  }
}
