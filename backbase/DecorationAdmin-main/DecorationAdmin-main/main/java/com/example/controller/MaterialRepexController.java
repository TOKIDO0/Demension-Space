package com.example.controller;

import com.example.common.Result;
import com.example.entity.ConstructionRepex;
import com.example.entity.MaterialRepex;
import com.example.service.MaterialRepexService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

@RestController
@RequestMapping("/api/MaterialRep")
public class MaterialRepexController {
    @Resource
    MaterialRepexService materialRepexService;

    @GetMapping("/generate")
    public Result<MaterialRepex> generateall(@RequestParam(required=false,defaultValue = "") String id)
    {
        long l=Long.parseLong(id);
        return Result.success(materialRepexService.generate(l));
    }
}
