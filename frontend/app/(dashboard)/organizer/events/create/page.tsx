"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCategories } from "@/lib/query/categories.query";
import { useCreateEvent } from "@/lib/query/events.query";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Upload,
  Loader2,
  AlertCircle,
  Globe,
  ImageIcon,
} from "lucide-react";

const createEventFormSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(200),
    description: z.string().min(10, "Description must be at least 10 characters"),
    categoryId: z.string().optional(),
    location: z.string().min(2, "Location is required"),
    isOnline: z.boolean(),
    meetingLink: z.string().optional(),
    startDate: z.string().min(1, "Start date and time required"),
    endDate: z.string().min(1, "End date and time required"),
    capacity: z.number().int().positive("Capacity must be at least 1 seat"),
    bannerUrl: z.string().optional(),
  })
  .refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

type CreateEventFormValues = z.infer<typeof createEventFormSchema>;

export default function CreateEventPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const createMutation = useCreateEvent();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      location: "",
      isOnline: false,
      meetingLink: "",
      startDate: "",
      endDate: "",
      capacity: 50,
      bannerUrl: "",
    },
  });

  const isOnline = watch("isOnline");

  // Direct secure upload to Cloudinary using signed credentials
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    setIsUploadingImage(true);
    setServerError(null);

    try {
      // 1. Fetch secure signature from backend
      const sigResponse = await apiClient.post("/uploads/signature", {
        folder: "univent/events",
      });

      const { timestamp, signature, apiKey, cloudName, folder } =
        sigResponse.data.data;

      // 2. Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        setValue("bannerUrl", uploadData.secure_url);
        setImagePreview(uploadData.secure_url);
      } else {
        throw new Error(uploadData.error?.message || "Failed to upload image to Cloudinary");
      }
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? `Image upload error: ${err.message}`
          : "Could not upload image to Cloudinary. You can still paste an image URL directly.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (values: CreateEventFormValues) => {
    setServerError(null);
    try {
      await createMutation.mutateAsync({
        title: values.title,
        description: values.description,
        categoryId: values.categoryId || undefined,
        location: values.location,
        isOnline: values.isOnline,
        meetingLink: values.meetingLink || undefined,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
        capacity: values.capacity,
        bannerUrl: values.bannerUrl || undefined,
      });

      router.push("/organizer/events");
      router.refresh();
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create event. Please try again.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Managed Events
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create New Event
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the specifications for your university workshop, seminar, or competition.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Banner Upload */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="block text-xs font-semibold tracking-wide text-foreground uppercase">
            Event Banner Image
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upload an eye-catching poster or banner for your event (16:9 ratio recommended)
          </p>

          <div className="mt-3">
            {imagePreview ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Banner preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setValue("bannerUrl", "");
                  }}
                  className="absolute top-2 right-2 rounded-md bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm transition hover:bg-destructive hover:text-destructive-foreground"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition hover:border-primary/50 hover:bg-muted/40">
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-xs font-medium text-foreground">
                        Uploading to Cloudinary...
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-xs font-medium text-foreground">
                        Click to upload image or drag and drop
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        PNG, JPG, or WEBP up to 10MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={isUploadingImage}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        </div>

        {/* Basic Details */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Event Information</h3>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-xs font-semibold tracking-wide text-foreground uppercase"
            >
              Event Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Modern Fullstack Web Development Workshop"
              {...register("title")}
              className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="categoryId"
              className="block text-xs font-semibold tracking-wide text-foreground uppercase"
            >
              Category
            </label>
            <select
              id="categoryId"
              {...register("categoryId")}
              className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="">Select a category (optional)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-xs font-semibold tracking-wide text-foreground uppercase"
            >
              Description & Prerequisites
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Describe the agenda, prerequisites, target audience, and outcomes of the session..."
              {...register("description")}
              className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        {/* Format, Location & Capacity */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Logistics & Venue</h3>

          {/* Format Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
            <div>
              <p className="text-xs font-semibold text-foreground">Online Event</p>
              <p className="text-[11px] text-muted-foreground">
                Check this if the event takes place virtually via Zoom / Google Meet
              </p>
            </div>
            <input
              type="checkbox"
              {...register("isOnline")}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>

          {/* Meeting Link (if online) */}
          {isOnline && (
            <div>
              <label
                htmlFor="meetingLink"
                className="block text-xs font-semibold tracking-wide text-foreground uppercase"
              >
                Virtual Meeting Link
              </label>
              <input
                id="meetingLink"
                type="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                {...register("meetingLink")}
                className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
            </div>
          )}

          {/* Physical Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-xs font-semibold tracking-wide text-foreground uppercase"
            >
              {isOnline ? "Virtual Platform / Host Name" : "Physical Location / Lab Hall"}
            </label>
            <input
              id="location"
              type="text"
              placeholder={isOnline ? "Google Meet" : "e.g. ICT Lab 2, Engineering Block A"}
              {...register("location")}
              className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
            {errors.location && (
              <p className="mt-1 text-xs text-destructive">{errors.location.message}</p>
            )}
          </div>

          {/* Capacity */}
          <div>
            <label
              htmlFor="capacity"
              className="block text-xs font-semibold tracking-wide text-foreground uppercase"
            >
              Maximum Capacity (Seats)
            </label>
            <input
              id="capacity"
              type="number"
              min={1}
              placeholder="100"
              {...register("capacity", { valueAsNumber: true })}
              className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
            {errors.capacity && (
              <p className="mt-1 text-xs text-destructive">{errors.capacity.message}</p>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Schedule</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="startDate"
                className="block text-xs font-semibold tracking-wide text-foreground uppercase"
              >
                Start Date & Time
              </label>
              <input
                id="startDate"
                type="datetime-local"
                {...register("startDate")}
                className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-xs font-semibold tracking-wide text-foreground uppercase"
              >
                End Date & Time
              </label>
              <input
                id="endDate"
                type="datetime-local"
                {...register("endDate")}
                className="mt-1.5 block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/organizer/events">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="gap-2 font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing Event...
              </>
            ) : (
              "Publish Event"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
