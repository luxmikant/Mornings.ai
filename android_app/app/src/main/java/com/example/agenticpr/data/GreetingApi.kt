package com.example.agenticpr.data

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit

data class ArtifactResponse(
    val id: String,
    val headline: String,
    val body_copy: String,
    val shloka_text: String?,
    val composite_image_url: String?,
    val status: String
)

data class ArtifactDailyResponse(
    val has_artifact: Boolean,
    val artifact: ArtifactResponse?,
    val message: String
)

data class GenerateRequest(
    val event_name: String? = null,
    val event_date: String? = null,
    val user_name: String? = "आदरणीय सदस्य",
    val user_designation: String? = "समाजसेवी",
    val custom_instruction: String? = null
)

data class AgentChatOrderRequest(
    val chat_prompt: String,
    val event_name: String? = null,
    val event_date: String? = null,
    val save_to_memory: Boolean = true,
    val user_name: String? = "आदरणीय सदस्य",
    val user_designation: String? = "समाजसेवी"
)

data class AgentChatOrderResponse(
    val agent_message: String,
    val artifact: ArtifactResponse,
    val memory_saved: Boolean
)

interface GreetingApiService {
    @GET("api/v1/artifacts/daily")
    suspend fun getDailyGreeting(): ArtifactDailyResponse

    @POST("api/v1/artifacts/generate")
    suspend fun generateArtifact(@Body req: GenerateRequest): ArtifactResponse

    @POST("api/v1/artifacts/agent-chat")
    suspend fun orderAgentChat(@Body req: AgentChatOrderRequest): AgentChatOrderResponse
}

object ApiClient {
    // 10.0.2.2 points to host machine localhost from the Android emulator
    private const val BASE_URL = "http://10.0.2.2:8000/"

    private val client = OkHttpClient.Builder()
        .connectTimeout(45, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    val service: GreetingApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(GreetingApiService::class.java)
    }
}
