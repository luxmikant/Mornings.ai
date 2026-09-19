package com.agenticpr.manager.network

import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Body

// Basic DTOs mirroring FastAPI schemas
data class ArtifactDailyResponse(
    val has_artifact: Boolean,
    val artifact: Artifact?,
    val message: String
)

data class Artifact(
    val id: String,
    val event_name: String?,
    val headline: String,
    val body_copy: String,
    val composite_image_url: String?,
    val status: String
)

data class TweakRequest(
    val tone_register: String? = null,
    val custom_instruction: String? = null
)

data class DispatchRequest(
    val action: String,
    val target_platform: String = "WHATSAPP_STATUS"
)

interface ApiService {
    @GET("artifacts/daily")
    suspend fun getDailyGreeting(): ArtifactDailyResponse

    @POST("artifacts/{id}/tweak")
    suspend fun tweakGreeting(
        @Path("id") artifactId: String,
        @Body request: TweakRequest
    ): Artifact

    @POST("artifacts/{id}/dispatch")
    suspend fun recordDispatch(
        @Path("id") artifactId: String,
        @Body request: DispatchRequest
    ): okhttp3.ResponseBody
}
