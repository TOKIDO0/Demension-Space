package com.example.controller;

import com.example.common.Result;
import com.example.entity.ConstructionRepex;
import com.example.entity.CustomerRep;
import com.example.service.ConstructionRepexService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

@RestController
@RequestMapping("/api/ConstructionRep")
public class ConstructionRepexController {
    @Resource
    private ConstructionRepexService constructionRepexService;

    @GetMapping("/generate")
    public Result<ConstructionRepex> generateall(@RequestParam(required=false,defaultValue = "") String id)
    {
        long l=Long.parseLong(id);
        return Result.success(constructionRepexService.generateall(l));
    }

}
