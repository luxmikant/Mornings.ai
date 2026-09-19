package com.example.agenticpr.ui

import android.content.Intent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.agenticpr.data.ApiClient
import com.example.agenticpr.data.ArtifactResponse
import com.example.agenticpr.data.AgentChatOrderRequest
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyGreetingScreen() {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    var artifact by remember { mutableStateOf<ArtifactResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var statusMessage by remember { mutableStateOf("आज का संदेश लोड हो रहा है...") }

    // Chat / On-Demand Agent State
    var showChatStudio by remember { mutableStateOf(false) }
    var chatPrompt by remember { mutableStateOf("") }
    var selectedEvent by remember { mutableStateOf("MAHA_SHIVRATRI") }
    var saveToMemory by remember { mutableStateOf(true) }
    var agentFeedback by remember { mutableStateOf("") }

    val festivalChips = listOf(
        "MAHA_SHIVRATRI" to "महाशिवरात्रि 🔱",
        "DIWALI" to "दीपावली 🪔",
        "HOLI" to "होली 🎨",
        "MAKAR_SANKRANTI" to "मकर संक्रांति ☀️",
        "TODAY_DEVOTIONAL" to "दैनिक शुभ प्रभात 🙏"
    )

    fun fetchInitialGreeting() {
        isLoading = true
        scope.launch {
            try {
                val resp = ApiClient.service.getDailyGreeting()
                if (resp.has_artifact && resp.artifact != null) {
                    artifact = resp.artifact
                    statusMessage = ""
                } else {
                    // Auto-order initial greeting if none found
                    val chatResp = ApiClient.service.orderAgentChat(
                        AgentChatOrderRequest(
                            chat_prompt = "शुभ प्रभात मंगल वेला एवं ईष्ट वंदना",
                            event_name = "TODAY_DEVOTIONAL"
                        )
                    )
                    artifact = chatResp.artifact
                    statusMessage = ""
                }
            } catch (e: Exception) {
                statusMessage = "कनेक्शन त्रुटि: ${e.localizedMessage ?: "बैकएंड से संपर्क नहीं हो सका"}"
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) {
        fetchInitialGreeting()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Agentic PR Manager 🪔",
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    ) 
                },
                actions = {
                    IconButton(onClick = { showChatStudio = !showChatStudio }) {
                        Text(if (showChatStudio) "✕" else "⚡", fontSize = 20.sp, color = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFFE65100),
                    titleContentColor = Color.White
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color(0xFFFFF8E1))
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // On-the-Go Chat Studio Toggle Banner
            Card(
                onClick = { showChatStudio = !showChatStudio },
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFECB3)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("⚡", fontSize = 24.sp)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "AI एजेंट स्टूडियो (On-Demand Studio)",
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFBF360C),
                            fontSize = 15.sp
                        )
                        Text(
                            "किसी भी पर्व का तुरंत कार्ड बनाएं और मेमोरी में सहेजें",
                            fontSize = 12.sp,
                            color = Color(0xFF5D4037)
                        )
                    }
                    Text(if (showChatStudio) "▲" else "▼", color = Color(0xFFBF360C))
                }
            }

            // Expandable Agent Chat Studio Box
            AnimatedVisibility(visible = showChatStudio) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "पर्व या अवसर चुनें:",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp,
                            color = Color(0xFF5D4037)
                        )
                        Spacer(modifier = Modifier.height(8.dp))

                        // Chips
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            festivalChips.take(3).forEach { (code, label) ->
                                FilterChip(
                                    selected = selectedEvent == code,
                                    onClick = { selectedEvent = code },
                                    label = { Text(label, fontSize = 11.sp) }
                                )
                            }
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            festivalChips.drop(3).forEach { (code, label) ->
                                FilterChip(
                                    selected = selectedEvent == code,
                                    onClick = { selectedEvent = code },
                                    label = { Text(label, fontSize = 11.sp) }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = chatPrompt,
                            onValueChange = { chatPrompt = it },
                            label = { Text("एजेंट को निर्देश दें (उदा: 'दीप प्रज्वलन और सुख समृद्धि का संदेश')") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 3,
                            shape = RoundedCornerShape(10.dp)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Checkbox(
                                checked = saveToMemory,
                                onCheckedChange = { saveToMemory = it }
                            )
                            Text(
                                "भविष्य के लिए याद रखें (Save to Agent Memory)",
                                fontSize = 12.sp,
                                color = Color(0xFF3E2723)
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Button(
                            onClick = {
                                isLoading = true
                                agentFeedback = "एजेंट द्वारा श्लोक, बैकड्रॉप और कार्ड तैयार किया जा रहा है..."
                                scope.launch {
                                    try {
                                        val res = ApiClient.service.orderAgentChat(
                                            AgentChatOrderRequest(
                                                chat_prompt = if (chatPrompt.isBlank()) "पावन पर्व पर सुख शांति और समृद्धि की मंगल कामना" else chatPrompt,
                                                event_name = selectedEvent,
                                                save_to_memory = saveToMemory
                                            )
                                        )
                                        artifact = res.artifact
                                        agentFeedback = res.agent_message
                                        showChatStudio = false
                                    } catch (e: Exception) {
                                        agentFeedback = "त्रुटि: ${e.localizedMessage}"
                                    } finally {
                                        isLoading = false
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE65100)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Text("कार्ड तैयार करें (Generate with AI) ⚡", fontWeight = FontWeight.Bold)
                        }

                        if (agentFeedback.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                agentFeedback,
                                fontSize = 12.sp,
                                color = Color(0xFF2E7D32),
                                textAlign = TextAlign.Center,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(350.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = Color(0xFFE65100), strokeWidth = 3.dp)
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = statusMessage,
                            color = Color(0xFF5D4037),
                            fontWeight = FontWeight.Medium,
                            fontSize = 14.sp
                        )
                    }
                }
            } else if (artifact != null) {
                val art = artifact!!
                val fullImageUrl = if (art.composite_image_url?.startsWith("http") == true) {
                    art.composite_image_url
                } else {
                    "http://10.0.2.2:8000${art.composite_image_url}"
                }

                // Greeting Card Preview
                Card(
                    shape = RoundedCornerShape(18.dp),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        AsyncImage(
                            model = fullImageUrl,
                            contentDescription = art.headline,
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(0.8f) // 1080x1350 ratio
                                .clip(RoundedCornerShape(14.dp)),
                            contentScale = ContentScale.Crop
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = art.headline,
                            fontSize = 19.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFBF360C),
                            textAlign = TextAlign.Center
                        )

                        if (!art.shloka_text.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = art.shloka_text,
                                fontSize = 13.sp,
                                color = Color(0xFF3E2723),
                                textAlign = TextAlign.Center,
                                lineHeight = 19.sp
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Single-Tap 1-Click WhatsApp Share Button
                Button(
                    onClick = {
                        val shareText = "${art.headline}\n\n${art.body_copy}\n\n$fullImageUrl\n\n— सादर प्रेषित"
                        val intent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, shareText)
                        }
                        context.startActivity(Intent.createChooser(intent, "शुभकामना साझा करें (WhatsApp)"))
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366)), // WhatsApp Green
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp)
                ) {
                    Text(
                        "WhatsApp पर साझा करें (1-Tap Share) 🚀",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(statusMessage, textAlign = TextAlign.Center, color = Color(0xFF5D4037))
                }
            }
        }
    }
}
